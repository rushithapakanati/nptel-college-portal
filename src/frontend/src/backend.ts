// Auto-generated stub backend interface for frontend-only builds.
// This file is replaced during full ICP build with actual generated bindings.

import { Actor, HttpAgent, type ActorConfig } from "@dfinity/agent";

export interface ExternalBlob {
  getBytes(): Promise<Uint8Array>;
  onProgress?: (progress: number) => void;
}

export namespace ExternalBlob {
  export function fromURL(url: string): ExternalBlob {
    return {
      getBytes: async () => {
        const r = await fetch(url);
        return new Uint8Array(await r.arrayBuffer());
      },
    };
  }
}

export interface CreateActorOptions {
  agentOptions?: Record<string, unknown>;
  agent?: HttpAgent;
  actorOptions?: ActorConfig;
  processError?: (e: unknown) => never;
}

export interface backendInterface {
  _initializeAccessControlWithSecret(token: string): Promise<void>;
  [key: string]: unknown;
}

export function createActor(
  _canisterId: string,
  _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  _downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>,
  _options?: CreateActorOptions
): backendInterface {
  const stub: backendInterface = {
    _initializeAccessControlWithSecret: async () => {},
  };
  return stub;
}
