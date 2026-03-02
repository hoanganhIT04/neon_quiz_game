import pandas as pd

# Đường dẫn file Excel
input_file = "question/Question.xlsx"

# File CSV xuất ra
output_file = "question/Question.csv"

try:
    df = pd.read_excel(input_file)
    df.to_csv(output_file, index=False, encoding="utf-8")
    print("✅ Đã chuyển Question.xlsx thành Question.csv thành công!")
except Exception as e:
    print("❌ Lỗi:", e)