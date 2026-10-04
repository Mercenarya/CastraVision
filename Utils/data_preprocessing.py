import pandas as pd
import os,sys

CURRENT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(CURRENT, "..")
sys.path.append(ROOT)
TEST_DATA_DIR = os.path.join(ROOT, "test_output", "sample_data.csv")

def check_dir_exists(dir_path) -> bool:
    """Kiểm tra xem thư mục có tồn tại không, nếu không thì tạo mới."""
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)
    else:
        print(f"Thư mục {dir_path} đã tồn tại.")
        return True
        

# thêm dữ liệu mới vào store csv hiện có, nếu không có thì tạo mới
def adding_new_data_to_csv(file_path:str, new_data):
    """
    Thêm dữ liệu mới vào file CSV hiện có.
    Nếu file không tồn tại, tạo mới file và ghi dữ liệu.
    """
    try:
        existxing_data = pd.read_csv(file_path)
        if isinstance(new_data,list):
            new_data = pd.DataFrame(new_data, columns=existxing_data.columns)
            updated_data = pd.concat([existxing_data, new_data], ignore_index=True)
            updated_data.to_csv(file_path, index=False)
            
        print(f"Đã thêm dữ liệu mới vào file {file_path}.")
        print(updated_data)
    
    
    except FileNotFoundError:
        new_data.to_csv(file_path, index=False)
        print(f"File {file_path} không tồn tại. Đã tạo mới file và ghi dữ liệu.")
    except Exception as e:
        print(f"Error occurred while adding new data to CSV: {e}")

# chuyển dữ liệu thô từ API thành DataFrame và lưu vào file csv
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

# cập nhật dữ liệu mới vào DataFrame hiện có, nếu không có thì tạo mới 
def update_data_to_dataframe(file_path:str, new_data:str, index:int):
    """
    Cập nhật dữ liệu mới vào DataFrame hiện có.
    Nếu file không tồn tại, tạo mới file và ghi dữ liệu.
    """
    try:
        existing_data_df = pd.read_csv(file_path)
        if index in existing_data_df.index:
            existing_data_df.loc[index] = new_data
            existing_data_df.to_csv(file_path, index=False)
            print(f"Đã cập nhật dữ liệu ở hàng {index} trong DataFrame.")
        else:
            print(f"Hàng {index} không tồn tại trong DataFrame. Không thể cập nhật dữ liệu.")
           
    except FileNotFoundError:
        new_data_df = pd.DataFrame(new_data, columns=frame)
        new_data_df.to_csv(file_path, index=False)
        print(f"File {file_path} không tồn tại. Đã tạo mới file và ghi dữ liệu.")
    except Exception as e:
        print(f"Error occurred while updating data to DataFrame: {e}")

# xoá dữ liệu khỏi DataFrame hiện có
def delete_data(file_path:str, row_index:int):
    """
    Xóa dữ liệu khỏi DataFrame hiện có.
    """
    try:
        existing_data_df = pd.read_csv(file_path)
        if row_index in existing_data_df.index:
            existing_data_df = existing_data_df.drop(index=row_index).reset_index(drop=True)
            existing_data_df.to_csv(file_path, index=False)
            print(f"Đã xóa dữ liệu ở hàng {row_index} khỏi DataFrame.")
        else:
            print(f"Hàng {row_index} không tồn tại trong DataFrame.")
    except FileNotFoundError:
        print(f"File {file_path} không tồn tại. Không thể xóa dữ liệu.")
    except Exception as e:
        print(f"Error occurred while deleting data from DataFrame: {e}")

def clean_data_store(file_path:str):
    """
    Xóa tất cả dữ liệu trong DataFrame hiện có.
    """
    try:
    
        existing_data_df = pd.read_csv(file_path)
        
        if len(existing_data_df) == 0:
            print(f"DataFrame hiện tại đã trống. Không có dữ liệu để xóa.")
            return None
        
        else:
            # loại bỏ các dữ liệu null và các cells trống
            clean_data = existing_data_df.dropna(inplace=True).reset_index(drop=True)
            # loại bỏ trùng lặp dữ liệu
            clean_data.drop_duplicates(inplace=True)
            
            clean_data.to_csv(file_path, index=False)
    except Exception as e:
        print(f"Error occurred while cleaning data store: {e}")


if __name__ == "__main__":
    # Test the functions
    check_dir_exists(TEST_DATA_DIR)
    
    # dữ liệu mẫu để test - ma trận 1 dọng x 3 cột ( tương ứng đúng)
    data_test = [
        [3,"campaign C","active"],
        [4,"campaign D","active"]
    ]
    
    sample_data = [
        {"id": 1, "name": "Campaign A", "status": "active"},
        {"id": 2, "name": "Campaign B", "status": "paused"},
    ]
    frame = ["id", "name", "status"]
    df = convert_data_to_dataframe(TEST_DATA_DIR, sample_data, frame)
    print(df)
    
    adding_new_data_to_csv(TEST_DATA_DIR, data_test)
    update_data_to_dataframe(TEST_DATA_DIR, [5,"campaign E","active"], 1)
    delete_data(TEST_DATA_DIR, 0)