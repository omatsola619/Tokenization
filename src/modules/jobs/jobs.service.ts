import { getJobStatus } from '../../services/queue.service';

export class JobsService {
  async getStatus(jobId: string) {
    const status = await getJobStatus(jobId);
    if (!status) {
      throw { status: 404, message: 'Job not found' };
    }
    return status;
  }
}

export const jobsService = new JobsService();
