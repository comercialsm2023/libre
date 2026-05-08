import os
import time
import google.auth
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
import io

# Configurações
FILE_NAME = 'libre.sqlite'
LOCAL_PATH = os.path.expanduser('~/libre/data/libre.sqlite')
FOLDER_NAME = 'LIBRE_APP_DATA'

creds, project = google.auth.default()
drive_service = build('drive', 'v3', credentials=creds)

def get_folder_id():
    query = f"name = '{FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    results = drive_service.files().list(q=query, fields="files(id)").execute()
    files = results.get('files', [])
    if not files:
        file_metadata = {'name': FOLDER_NAME, 'mimeType': 'application/vnd.google-apps.folder'}
        folder = drive_service.files().create(body=file_metadata, fields='id').execute()
        return folder.get('id')
    return files[0]['id']

def download_db(folder_id):
    query = f"name = '{FILE_NAME}' and '{folder_id}' in parents and trashed = false"
    results = drive_service.files().list(q=query, fields="files(id)").execute()
    files = results.get('files', [])
    if files:
        file_id = files[0]['id']
        request = drive_service.files().get_media(fileId=file_id)
        fh = io.FileIO(LOCAL_PATH, 'wb')
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()
        print("Database downloaded from Drive.")
    else:
        print("No database found on Drive. Starting fresh.")

def upload_db(folder_id):
    query = f"name = '{FILE_NAME}' and '{folder_id}' in parents and trashed = false"
    results = drive_service.files().list(q=query, fields="files(id)").execute()
    files = results.get('files', [])
    
    file_metadata = {'name': FILE_NAME, 'parents': [folder_id]}
    media = MediaFileUpload(LOCAL_PATH, mimetype='application/x-sqlite3', resumable=True)
    
    if files:
        drive_service.files().update(fileId=files[0]['id'], media_body=media).execute()
        print("Database updated on Drive.")
    else:
        drive_service.files().create(body=file_metadata, media_body=media).execute()
        print("Database created on Drive.")

if __name__ == '__main__':
    import sys
    fid = get_folder_id()
    if "--upload" in sys.argv:
        if os.path.exists(LOCAL_PATH):
            upload_db(fid)
        else:
            print("Local database not found for upload.")
    else:
        # Modo inicial: se o ficheiro não existe localmente, tenta sacar do drive
        if not os.path.exists(LOCAL_PATH):
            download_db(fid)
        else:
            print("Local database already exists.")
