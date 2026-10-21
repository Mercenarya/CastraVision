import logging
import sys

logger = logging.getLogger("google.ads.googleads.client")
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler(sys.stdout))