import { APIServiceClient } from '@b4fun/ku-protos';
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";

interface APISettings {
  grpcBaseURL: string;
}

var globalAPISettings: APISettings = {
  grpcBaseURL: process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:4000/',
};

const paramsKeyGRPCBaseURL = '_grpcBaseURL';

/**
 * setup setups the global api settings.
 */
export function setup() {
  let resolvedAPISettings: Partial<APISettings> = {};

  if (window) {
    const params = new URLSearchParams(window.location.search);

    const v = params.get(paramsKeyGRPCBaseURL);
    if (v) {
      resolvedAPISettings.grpcBaseURL = v;
      console.log(`resolved grpcBaseURL: ${v}`);
    }
  }

  globalAPISettings = {
    ...globalAPISettings,
    ...resolvedAPISettings,
  };
}

export function grpcClient(apiSettings?: APISettings): APIServiceClient {
  apiSettings = apiSettings || globalAPISettings;

  const grpcTransport = new GrpcWebFetchTransport({
    baseUrl: apiSettings.grpcBaseURL,
  })

  return new APIServiceClient(grpcTransport);
}
