"""
AI Task Worker — Entry Point

Starts the worker process that consumes jobs from the Redis queue
and processes them against MongoDB.
"""

import os
import sys
import logging
from dotenv import load_dotenv

load_dotenv()

from worker import TaskWorker

logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger("worker.main")


def main():
    logger.info("🐍 AI Task Worker starting up...")

    try:
        worker = TaskWorker()
        worker.start()
    except KeyboardInterrupt:
        logger.info("Worker stopped by user (SIGINT)")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Worker crashed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
