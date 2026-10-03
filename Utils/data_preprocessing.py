import pandas as pd
import os,sys

CURRENT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(CURRENT, "..")
sys.path.append(ROOT)


def check_dir_exists(dir_path):
    """Kiểm tra xem thư mục có tồn tại không, nếu không thì tạo mới."""
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)
    else:
        print(f"Thư mục {dir_path} đã tồn tại.")
        

def convert_data_to_dataframe(name_data:str,data: list, frame:list) -> pd.DataFrame:
    """
    Chuyển dữ liệu thô từ API thành DataFrame.
    """
    try:
        df = pd.DataFrame(data, columns=frame)
        df.to_csv(name_data, index=False)
        return df
    except Exception as e:
        print(f"Error occurred while converting data to DataFrame: {e}")
        return pd.DataFrame()
    
    
if __name__ == "__main__":
    # Test the functions
    test_dir = "test_output"
    check_dir_exists(test_dir)
    
    sample_data = [
        {"id": 1, "name": "Campaign A", "status": "active"},
        {"id": 2, "name": "Campaign B", "status": "paused"},
    ]
    frame = ["id", "name", "status"]
    df = convert_data_to_dataframe("sample_data.csv", sample_data, frame)
    print(df)