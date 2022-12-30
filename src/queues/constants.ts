// queue names
export const BLOCKS_QUEUE = 'blocks';

// processor names
export const INDEX_BLOCK = 'indexBlock';
export const MARK_BLOCK_AS_INDEXED = 'markBlockAsIndexed';
export const INVALIDATE_BLOCKS = 'invalidateBlocks';

// settings

export const JOB_SETTINGS = {
  attempts: 3,
  backoff: 1000,
};
