import os,sys
import pandas as pd

CURRENT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(CURRENT, "..")
sys.path.append(ROOT)

from data_preprocessing import check_dir_exists, adding_new_data_to_csv, convert_data_to_dataframe, update_data_to_dataframe
from TEST.facebookAgent.meta_test import check_campaigns, get_insights, get_ads



