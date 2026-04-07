"""
TaskWorker — Core worker that pulls jobs from Redis and processes them.
"""

import os
import json
import time
import logging
import signal
from datetime import datetime, timezone

import redis
from pymongo import MongoClient
from pymongo.errors import PyMongoError

from processor import process_task

logger = logging.getLogger("worker.core")


class TaskWorker:
    def __init__(self):
        self.queue_name = os.getenv("REDIS_QUEUE_NAME", "task_queue")
        self.poll_timeout = int(os.getenv("WORKER_POLL_TIMEOUT", "5"))
        self.max_retries = int(os.getenv("WORKER_MAX_RETRIES", "3"))
        self.running = True

        # Connect to Redis — supports Railway REDIS_URL or individual vars
        redis_url = os.getenv("REDIS_URL")
        if redis_url:
            self.redis = redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                retry_on_timeout=True,
            )
            logger.info("Connecting to Redis via REDIS_URL")
        else:
            self.redis = redis.Redis(
                host=os.getenv("REDIS_HOST", "localhost"),
                port=int(os.getenv("REDIS_PORT", "6379")),
                password=os.getenv("REDIS_PASSWORD") or None,
                decode_responses=True,
                socket_connect_timeout=5,
                retry_on_timeout=True,
            )
            logger.info("Connecting to Redis via host/port")

        # Connect to MongoDB
        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            raise ValueError("MONGODB_URI environment variable is not set")

        self.mongo = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=5000,
            socketTimeoutMS=30000,
        )
        self.db = self.mongo["aitasks"]
        self.tasks_col = self.db["tasks"]

        # Verify connections
        self.redis.ping()
        self.mongo.admin.command("ping")
        logger.info("Connected to Redis and MongoDB")

        # Graceful shutdown
        signal.signal(signal.SIGTERM, self._shutdown)
        signal.signal(signal.SIGINT, self._shutdown)

    def _shutdown(self, signum, frame):
        logger.info(f"Received signal {signum}. Shutting down gracefully...")
        self.running = False

    def start(self):
        """Main event loop — blocks on BRPOP until a job arrives."""
        logger.info(f"Listening on queue: '{self.queue_name}'")

        while self.running:
            try:
                result = self.redis.brpop(self.queue_name, timeout=self.poll_timeout)

                if result is None:
                    continue

                _, raw_job = result
                job = json.loads(raw_job)
                logger.info(f"Received job: {job.get('jobId')} for task {job.get('taskId')}")

                self._handle_job(job)

            except redis.ConnectionError as e:
                logger.error(f"Redis connection lost: {e}. Retrying in 5s...")
                time.sleep(5)
            except json.JSONDecodeError as e:
                logger.error(f"Malformed job payload: {e}")
            except Exception as e:
                logger.error(f"Unexpected error in main loop: {e}", exc_info=True)
                time.sleep(1)

        logger.info("Worker shut down cleanly.")

    def _handle_job(self, job: dict):
        """Process a single job with retry logic."""
        task_id = job.get("taskId")
        if not task_id:
            logger.error(f"Job missing taskId: {job}")
            return

        attempt = 0
        while attempt < self.max_retries:
            attempt += 1
            try:
                self._process_job(job, attempt)
                return
            except Exception as e:
                logger.warning(f"Attempt {attempt}/{self.max_retries} failed for task {task_id}: {e}")
                if attempt < self.max_retries:
                    time.sleep(2 ** attempt)
                else:
                    logger.error(f"Task {task_id} failed after {self.max_retries} attempts")
                    self._mark_failed(task_id, str(e))

    def _process_job(self, job: dict, attempt: int):
        """Execute one processing attempt for a job."""
        task_id = job["taskId"]
        operation = job["operation"]
        input_text = job["inputText"]

        logs = []

        def log(level: str, message: str):
            entry = {
                "level": level,
                "message": message,
                "timestamp": datetime.now(timezone.utc),
            }
            logs.append(entry)
            getattr(logger, level if level != "warn" else "warning")(
                f"[Task {task_id}] {message}"
            )

        # Mark task as running in MongoDB
        self.tasks_col.update_one(
            {"_id": self._object_id(task_id)},
            {
                "$set": {
                    "status": "running",
                    "startedAt": datetime.now(timezone.utc),
                    "result": None,
                },
                "$push": {
                    "logs": {
                        "level": "info",
                        "message": f"Worker picked up job (attempt {attempt})",
                        "timestamp": datetime.now(timezone.utc),
                    }
                },
            },
        )

        log("info", f"Processing operation: '{operation}'")

        # Run the actual processing
        result = process_task(operation, input_text)

        log("info", f"Operation completed. Result length: {len(str(result))} chars")

        # Mark task as success in MongoDB
        self.tasks_col.update_one(
            {"_id": self._object_id(task_id)},
            {
                "$set": {
                    "status": "success",
                    "result": str(result),
                    "completedAt": datetime.now(timezone.utc),
                },
                "$push": {"logs": {"$each": logs}},
            },
        )

        logger.info(f"Task {task_id} completed successfully")

    def _mark_failed(self, task_id: str, error_message: str):
        """Mark a task as permanently failed in MongoDB."""
        try:
            self.tasks_col.update_one(
                {"_id": self._object_id(task_id)},
                {
                    "$set": {
                        "status": "failed",
                        "completedAt": datetime.now(timezone.utc),
                    },
                    "$push": {
                        "logs": {
                            "level": "error",
                            "message": f"Task failed: {error_message}",
                            "timestamp": datetime.now(timezone.utc),
                        }
                    },
                },
            )
        except PyMongoError as e:
            logger.error(f"Failed to mark task {task_id} as failed in MongoDB: {e}")

    @staticmethod
    def _object_id(task_id: str):
        """Convert string to MongoDB ObjectId."""
        from bson import ObjectId
        return ObjectId(task_id)