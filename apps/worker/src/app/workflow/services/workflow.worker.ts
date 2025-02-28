import { Injectable, Logger } from '@nestjs/common';
import {
  BullMqService,
  getWorkflowWorkerOptions,
  IWorkflowDataDto,
  PinoLogger,
  storage,
  Store,
  TriggerEvent,
  WorkerOptions,
  WorkerProcessor,
  WorkflowInMemoryProviderService,
  WorkflowWorkerService,
} from '@novu/application-generic';
import { CommunityOrganizationRepository } from '@novu/dal';
import { ObservabilityBackgroundTransactionEnum } from '@novu/shared';

const nr = require('newrelic');

const LOG_CONTEXT = 'WorkflowWorker';

@Injectable()
export class WorkflowWorker extends WorkflowWorkerService {
  constructor(
    private triggerEventUsecase: TriggerEvent,
    public workflowInMemoryProviderService: WorkflowInMemoryProviderService,
    private organizationRepository: CommunityOrganizationRepository,
    private logger: PinoLogger
  ) {
    super(new BullMqService(workflowInMemoryProviderService));

    this.initWorker(this.getWorkerProcessor(), this.getWorkerOptions());
  }

  private getWorkerOptions(): WorkerOptions {
    return getWorkflowWorkerOptions();
  }

  private getWorkerProcessor(): WorkerProcessor {
    return async ({ data }: { data: IWorkflowDataDto }) => {
      const organizationExists = await this.organizationExist(data);

      if (!organizationExists) {
        Logger.log(`Organization not found for organizationId ${data.organizationId}. Skipping job.`, LOG_CONTEXT);

        return;
      }

      return await new Promise((resolve, reject) => {
        const _this = this;

        Logger.verbose(`Job ${data.identifier} is being processed in the new instance workflow worker`, LOG_CONTEXT);

        nr.startBackgroundTransaction(
          ObservabilityBackgroundTransactionEnum.TRIGGER_HANDLER_QUEUE,
          'Trigger Engine',
          function processTask() {
            const transaction = nr.getTransaction();

            storage.run(new Store(PinoLogger.root), () => {
              _this.triggerEventUsecase
                .execute(data)
                .then(resolve)
                .catch((e) => {
                  nr.noticeError(e);
                  reject(e);
                })
                .finally(() => {
                  transaction.end();
                });
            });
          }
        );
      });
    };
  }

  private async organizationExist(data: IWorkflowDataDto): Promise<boolean> {
    const { organizationId } = data;

    const organization = await this.organizationRepository.findOne({ _id: organizationId });

    return !!organization;
  }
}
