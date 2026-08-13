import base64
import bz2
import zlib
import lzma
import gzip
import sys
from datetime import datetime

# 修复 P1-4：异常输入全链路守卫
# 获取当前日期和时间
now = datetime.now()
formatted_date = now.strftime("%Y-%m-%d %H:%M:%S")


def try_decompress(data):
    try:
        decompressed_data = gzip.decompress(data)
        return decompressed_data
    except Exception as e:
        pass
    # 尝试使用 bz2 解压缩
    try:
        decompressed_data = bz2.decompress(data)
        return decompressed_data
    except Exception as e:
        pass
    # 尝试使用 zlib 解压缩
    try:
        decompressed_data = zlib.decompress(data)
        return decompressed_data
    except Exception as e:
        pass
    # 尝试使用 lzma 解压缩
    try:
        decompressed_data = lzma.decompress(data)
        return decompressed_data
    except Exception as e:
        pass
    # 如果无法解压缩，则返回原始数据
    return data


def try_decode_base64(data):
    try:
        decoded_data = base64.b64decode(data)
        return decoded_data
    except Exception as e:
        pass
    # 如果无法解码，则返回原始数据
    return data


def extract_base64_encoded(data):
    """安全提取 base64.b64decode('...') 中的内容"""
    # 修复：使用 find 代替 index，防 ValueError 崩溃
    start_idx = data.find("base64.b64decode(")
    if start_idx == -1:
        return None  # 如果未找到目标字符串，返回 None
    # 查找 ' 的位置，从 base64.b64decode( 后面开始找
    quote_idx = data.find("'", start_idx + len("base64.b64decode("))
    if quote_idx == -1:
        return None  # 找不到引号，返回 None
    # 提取 'XXXX' 中的 XXXX 部分
    end_idx = data.find("'", quote_idx + 1)
    if end_idx == -1:
        return None  # 找不到结束引号，返回 None
    return data[quote_idx + 1:end_idx]


def decrypt_nested(data):
    if not data:
        return None
    while True:
        new_data = try_decode_base64(data)
        new_data = try_decompress(new_data)
        if "exec(" in str(new_data):
            # 更新 decrypted_data 以便下一次循环使用
            if "Encoded script" in str(new_data):
                new_data = "该加密未适配 敬请期待"
                print("该加密未适配 敬请期待")
                break
            elif "exec(" in str(new_data):
                data = extract_base64_encoded(str(new_data))
                if not data:
                    print("无法提取 base64 数据，退出循环")
                    break
            else:
                print("未知 加密 无法进一步解密")
                new_data = "未知 加密 无法进一步解密"
                break
        else:
            print("无法进一步解密，退出循环")
            break

    return new_data  # 返回最终解密后的数据


def process_data(data):
    if isinstance(data, str):
        byte_data = data.encode('utf-8')
    elif isinstance(data, bytes):
        byte_data = data
    else:
        raise TypeError("Expected string or bytes-like object")
    return byte_data


# 主流程：带守卫
with open('./input.py', 'r', encoding='utf-8') as file:
    content = file.read().strip()

encoded_data = extract_base64_encoded(content)
if not encoded_data:
    print("未找到 base64.b64decode 特征，可能是未知加密格式")
    sys.exit(1)

# 解密嵌套加密数据
final_decrypted_data = decrypt_nested(encoded_data)
if final_decrypted_data is None:
    print("解密失败：无法识别的加密格式")
    sys.exit(1)

print(final_decrypted_data)
with open("./output.py", 'wb') as f:
    f.write(process_data("#") + process_data(formatted_date) + process_data("\n") + process_data(final_decrypted_data))