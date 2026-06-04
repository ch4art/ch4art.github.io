import { withBase } from './withBase';

/** URL for an optimized model in public/models/ (already base-prefixed). */
export const modelUrl = (file: string) => withBase(`models/${file}`);

/** Path to the self-hosted Draco decoder directory (trailing slash required). */
export const dracoPath = () => withBase('draco-gltf/');
