import React, { useState } from 'react';
import { Button, Platform, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const TestScreen = () => {
  const [downloading, setDownloading] = useState(false);

  const checkPermissions = async () => {
    const permission =
      Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE
        : PERMISSIONS.IOS.PHOTO_LIBRARY;

    const result = await check(permission);
    if (result === RESULTS.GRANTED) {
      return true;
    } else {
      const requestResult = await request(permission);
      return requestResult === RESULTS.GRANTED;
    }
  };

  const downloadFile = async () => {
    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'You need permission to access storage.');
      return;
    }

    setDownloading(true);

    const fileUrl = 'https://example.com/path/to/your/file.jpg'; // Replace with the actual URL
    const fileName = 'downloadedFile.jpg'; // You can dynamically name the file

    // Path where the file will be saved (external storage for Android or Documents directory for iOS)
    const path = Platform.OS === 'android' 
      ? `${RNFS.ExternalStorageDirectoryPath}/${fileName}` 
      : `${RNFS.DocumentDirectoryPath}/${fileName}`;

    try {
      const downloadResult = await RNFS.downloadFile({
        fromUrl: fileUrl,
        toFile: path,
      }).promise;

      if (downloadResult.statusCode === 200) {
        Alert.alert('Download Complete', `File saved to: ${path}`);
      } else {
        Alert.alert('Download Failed', 'Something went wrong with the download.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Download Failed', 'Something went wrong with the download.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      title={downloading ? 'Downloading...' : 'Download File'}
      onPress={downloadFile}
      disabled={downloading}
    />
  );
};

export default TestScreen;
