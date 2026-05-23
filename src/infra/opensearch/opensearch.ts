// TODO: Replace with actual OpenSearch client
// import { Client } from '@opensearch-project/opensearch';
// import { config } from '../shared/config';
// export const opensearch = new Client({ node: config.OPENSEARCH_URL });

export const opensearch = {
  search: async (_index: string, _body: Record<string, unknown>) => {
    console.warn('OpenSearch not configured — using dummy client');
    return { hits: { hits: [] } };
  },
  index: async (_index: string, _body: Record<string, unknown>) => {
    console.warn('OpenSearch not configured — using dummy client');
    return { result: 'created' };
  },
};
