import os,sys
import pandas as pd
import subprocess
import time

CURRENT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(CURRENT, "..")
sys.path.append(ROOT)

ads_csv_sample = os.path.join(ROOT,"test_output","ads_sample.csv")

from data_preprocessing import check_dir_exists, adding_new_data_to_csv
from data_preprocessing import convert_data_to_dataframe, update_data_to_dataframe
from data_preprocessing import clean_data_store
from Datasources.facebookAgent.meta_test import check_campaigns, get_insights, get_ads, get_ads_content

# tự động tạo các Commands trong pipeline
def auto_generate_tasks(filepath:str, commands:list):
    try:
        result_exsits = check_dir_exists(filepath)
        if result_exsits is True:
            result_commands = subprocess.run(
                commands,
                shell=True,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=False,
                capture_output=False,
                cwd=filepath
            )
            if result_commands.returncode == 0:
                print(f"[+]: Set up completed: {commands}")
            else:
                print(f"[-]: Set up failed: {commands}")
    except Exception as e:
        print(f"Error occurred while auto generating tasks: {e}")

# chạy pipline tự động (functions)
def set_functions_pipeline(filepath:str, commands:list):
    """
    Thiết lập các chức năng trong pipeline.
    """
    try:
        # time.sleep(3)
        # auto_generate_tasks(filepath, commands)
        # time.sleep(3)
        insights_start_date = '2026-01-01'
        insights_end_date = '2026-01-07'
        result_id = check_campaigns()
        time.sleep(3)
        print(get_insights(result_id,insights_start_date,insights_end_date))
        time.sleep(3)
        print(get_ads())
        time.sleep(3)
        ads_data = get_ads_content()
        time.sleep(3)
        check_dir_exists(ads_csv_sample)
        time.sleep(3)
        frame = ["ad_id","ad_name","images","ad_title","ad_content"]
        result =convert_data_to_dataframe(ads_csv_sample,ads_data,frame)
        print(result)
        
    except Exception as e:
        print(f"Error occurred while setting functions in pipeline: {e}")


if __name__ == "__main__":
    # Example usage
    # py_execute_tools = sys.executable()
    
    filepath = os.path.join(ROOT, "test_output")
    commands = ["echo 'Hello, World!'"]
    print(set_functions_pipeline(filepath, commands))