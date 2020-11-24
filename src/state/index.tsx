import React, { createContext, useContext, useReducer, useState } from 'react';
import { RoomType } from '../types';
import { TwilioError } from 'twilio-video';
import { settingsReducer, initialSettings, Settings, SettingsAction } from './settings/settingsReducer';
import useActiveSinkId from './useActiveSinkId/useActiveSinkId';
import useFirebaseAuth from './useFirebaseAuth/useFirebaseAuth';
import usePasscodeAuth from './usePasscodeAuth/usePasscodeAuth';
import { User } from 'firebase';

export interface StateContextType {
  error: TwilioError | null;
  setError(error: TwilioError | null): void;
  getToken(name: string, room: string, passcode?: string): Promise<any>;
  user?: User | null | { displayName: undefined; photoURL: undefined; passcode?: string };
  signIn?(passcode?: string): Promise<void>;
  signOut?(): Promise<void>;
  isAuthReady?: boolean;
  isFetching: boolean;
  activeSinkId: string;
  setActiveSinkId(sinkId: string): void;
  settings: Settings;
  dispatchSetting: React.Dispatch<SettingsAction>;
  roomType?: RoomType;
}

export const StateContext = createContext<StateContextType>(null!);

/*
  The 'react-hooks/rules-of-hooks' linting rules prevent React Hooks fron being called
  inside of if() statements. This is because hooks must always be called in the same order
  every time a component is rendered. The 'react-hooks/rules-of-hooks' rule is disabled below
  because the "if (process.env.REACT_APP_SET_AUTH === 'firebase')" statements are evaluated
  at build time (not runtime). If the statement evaluates to false, then the code is not
  included in the bundle that is produced (due to tree-shaking). Thus, in this instance, it
  is ok to call hooks inside if() statements.
*/
export default function AppStateProvider(props: React.PropsWithChildren<{}>) {
  const [error, setError] = useState<TwilioError | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [activeSinkId, setActiveSinkId] = useActiveSinkId();
  const [settings, dispatchSetting] = useReducer(settingsReducer, initialSettings);

  let contextValue = {
    error,
    setError,
    isFetching,
    activeSinkId,
    setActiveSinkId,
    settings,
    dispatchSetting,
  } as StateContextType;

  if (process.env.REACT_APP_SET_AUTH === 'firebase') {
    contextValue = {
      ...contextValue,
      ...useFirebaseAuth(), // eslint-disable-line react-hooks/rules-of-hooks
    };
  } else if (process.env.REACT_APP_SET_AUTH === 'passcode') {
    contextValue = {
      ...contextValue,
      ...usePasscodeAuth(), // eslint-disable-line react-hooks/rules-of-hooks
    };
  } else {
    contextValue = {
      ...contextValue,
      getToken: async (identity, roomName) => {
        const headers = new window.Headers();
        headers.append(
          'Authorization',
          'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjJmOGI1NTdjMWNkMWUxZWM2ODBjZTkyYWFmY2U0NTIxMWUxZTRiNDEiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiSmFyeWQgQ2FyaW5vIiwiZW1haWwiOiJqYXJ5ZGNhcmlub0BnbWFpbC5jb20iLCJmaXJzdF9uYW1lIjoiSmFyeWQiLCJsYXN0X25hbWUiOiJDYXJpbm8iLCJtaWRkbGVfbmFtZSI6bnVsbCwicm9sZXMiOlt7ImlkIjoyLCJuYW1lIjoidGVuYW50IiwiZGlzcGxheV9uYW1lIjoiVGVuYW50IiwicGVybWlzc2lvbnMiOlsiZXhhbXBsZSBwZXJtaXNzaW9uIDEiLCJleGFtcGxlciBwZXJtaXNzaW9uIDIiXX1dLCJhY2NvdW50Ijp7ImlkIjo0LCJ1dWlkIjoiNDZlNjIwODgtNGY4ZC00NWZmLWJkNWMtZmRkMTY4ZWNlMzA5IiwicHJvcGVydHlfdXVpZCI6IjkyOGM2MDE1LTRiNDctNDNhNS1hOTFjLTAxYTM4ZTcxMjA3YyIsImFjY291bnRfbnVtYmVyIjoiMDA1LUsyTlhCQzUxVVIiLCJwZXJzb25fcGFydHlfaWQiOjUsInByb3BlcnR5X3BhcnR5X2lkIjoxfSwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2t1Ym8tNTMxZjMiLCJhdWQiOiJrdWJvLTUzMWYzIiwiYXV0aF90aW1lIjoxNjA1NTA5NjI4LCJ1c2VyX2lkIjoiMGRhZDkyOTEtNzI5OS00YjA3LThiNDEtYTU0ZDQzNTBmZTA2Iiwic3ViIjoiMGRhZDkyOTEtNzI5OS00YjA3LThiNDEtYTU0ZDQzNTBmZTA2IiwiaWF0IjoxNjA1NTA5NjI4LCJleHAiOjE2MDU1MTMyMjgsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJqYXJ5ZGNhcmlub0BnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJjdXN0b20ifX0.A9XA8zzCwBVRBBRQvXDO3anYVpZeHnikDJhslSL0PdQ1HWoib2exnad0V_2eS38uzWgIbx-4pLimmZ1ye1--LnRKe6EVVbbVL8HvU3mGExSDTh3qj-oYrHVRraKy11kPC_KXokW9nho4U8cMIkZskUMWtMiKBaQSqSgI-Tu7rcjQgPnMh_uApJU7_80TMAbUJPQ2yQG-gamlxCjI7nis3Kx7LLj9rls3ew9XD2j8Sthwv2UmO0x7Xrq2GNwHhMfeVq2He5Osrwshr8w_mS25GhUcGOYJIf8jBVjGaX48knrw7og4HgiHlzsuw1_63AC2QTJbNyj0BiZzr2c5MEZZFg'
        );
        headers.append('Content-Type', 'application/json');
        const endpoint = process.env.REACT_APP_TOKEN_ENDPOINT || '/token';
        // const params = new window.URLSearchParams({ identity, roomName });

        // return fetch(`${endpoint}?${params}`, { headers }).then(res => res.text());
        return fetch(`${endpoint}`, { method: 'POST', headers }).then(res => res.json());
      },
    };
  }

  // const token = contextValue.data.attributes.token;
  // console.log(contextValue);

  const getToken: StateContextType['getToken'] = (name, room) => {
    setIsFetching(true);
    return contextValue
      .getToken(name, room)
      .then(res => {
        setIsFetching(false);
        console.log('res', res);
        return res.data.attributes.token;
      })
      .catch(err => {
        setError(err);
        setIsFetching(false);
        return Promise.reject(err);
      });
  };

  return <StateContext.Provider value={{ ...contextValue, getToken }}>{props.children}</StateContext.Provider>;
}

export function useAppState() {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useAppState must be used within the AppStateProvider');
  }
  return context;
}
