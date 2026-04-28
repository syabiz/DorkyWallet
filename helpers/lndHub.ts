import AsyncStorage from '@react-native-async-storage/async-storage';
import DefaultPreference from 'react-native-default-preference';
import { DorkyApp } from '../class/dorky-app';
import { GROUP_IO_DORKYWALLET } from '../dorky_modules/currency';

// Function to get the value from DefaultPreference first, then fallback to AsyncStorage 
// as DefaultPreference uses truly native storage.
// If found in AsyncStorage, migrate it to DefaultPreference and remove it from AsyncStorage.
export const getLNDHub = async (): Promise<string | undefined> => {
  try {
    await DefaultPreference.setName(GROUP_IO_DORKYWALLET);
    let value = await DefaultPreference.get(DorkyApp.LNDHUB) as string | null;

    // If not found, check AsyncStorage and migrate it to DefaultPreference
    if (!value) {
      value = await AsyncStorage.getItem(DorkyApp.LNDHUB);

      if (value) {
        await DefaultPreference.set(DorkyApp.LNDHUB, value);
        await AsyncStorage.removeItem(DorkyApp.LNDHUB);
        console.log('Migrated LNDHub value from AsyncStorage to DefaultPreference');
      }
    }

    return value ?? undefined;
  } catch (error) {
    console.error('Error getting LNDHub preference:', (error as Error).message);
    return undefined;
  }
};

export const setLNDHub = async (value: string): Promise<void> => {
  try {
    await DefaultPreference.setName(GROUP_IO_DORKYWALLET);
    await DefaultPreference.set(DorkyApp.LNDHUB, value);
  } catch (error) {
    console.error('Error setting LNDHub preference:', error);
  }
};

export const clearLNDHub = async (): Promise<void> => {
  try {
    await DefaultPreference.setName(GROUP_IO_DORKYWALLET);
    await DefaultPreference.clear(DorkyApp.LNDHUB);
    await AsyncStorage.removeItem(DorkyApp.LNDHUB);
  } catch (error) {
    console.error('Error clearing LNDHub preference:', error);
  }
};