// queue names
export const BLOCKS_QUEUE = 'blocks';
export const METADATA_QUEUE = 'metadata';

// processor names
export const INDEX_BLOCK = 'indexBlock';
export const MARK_BLOCK_AS_INDEXED = 'markBlockAsIndexed';
export const INVALIDATE_BLOCKS = 'invalidateBlocks';
export const INDEX_METADATA = 'indexMetadata';
export const INDEX_MULTIPLE_METADATA = 'indexAllMetadata';

// settings for all jobs
export const JOB_SETTINGS = {
  attempts: 3,
  backoff: 1000,
};
