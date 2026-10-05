import { oracleStatusResponse } from '@/composition/lab/oracle-status-api';

export async function GET() {
  return oracleStatusResponse();
}
