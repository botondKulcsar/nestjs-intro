import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Patch,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TasksService } from './tasks.service';

import { CreateTaskDto } from './create-task.dto';
import { FindOneParams } from './find-one.params';
import { UpdateTaskDto } from './update-task.dto';
import { WrongTaskStatusException } from './exceptions/wrong-task-status.exception';
import { Task } from './task.entity';
import { CreateTaskLabelDto } from './create-task-label.dto';
import { FindTaskParams } from './find-task.params';
import { PaginationParams } from './../common/pagination.params';
import { PaginationResponse } from './../common/pagination.response';
import { CurrentUserId } from './../users/decorators/current-user-id.decorator';
// import { AuthRequest } from 'src/users/auth.request';./../src/users/decorators/current-user-id.decorator';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  public async findAll(
    @Query() filters: FindTaskParams,
    @Query() pagination: PaginationParams,
    @CurrentUserId() userId: string,
  ): Promise<PaginationResponse<Task>> {
    const [items, total] = await this.tasksService.findAll(
      filters,
      pagination,
      userId,
    );

    return {
      data: items,
      meta: {
        total,
        ...pagination,
      },
    };
  }

  @Get(':id')
  public async findOne(
    @Param() params: FindOneParams,
    @CurrentUserId() userId: string,
  ): Promise<Task> {
    const task = await this.findOneOrFail(params.id);
    this.checkTaskOwnership(task, userId);
    return task;
  }

  @Post()
  public async create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUserId() userId: string,
  ) {
    return await this.tasksService.createTask({
      ...createTaskDto,
      userId,
    });
  }

  @Patch(':id')
  public async updateTask(
    @Param() params: FindOneParams,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUserId() userId: string,
  ): Promise<Task> {
    const task = await this.findOneOrFail(params.id);
    this.checkTaskOwnership(task, userId);

    try {
      return await this.tasksService.updateTask(task, updateTaskDto);
    } catch (error) {
      if (error instanceof WrongTaskStatusException) {
        throw new BadRequestException([error.message]);
      }
      throw error;
    }
  }

  /* @Patch(':id/status')
  public async updateTaskStatus(
    @Param() params: FindOneParams,
    @Body() body: UpdateTaskStatusDto,
  ): ITask {
    const task = this.findOneOrFail(params.id);
    task.status = body.status;
    return task;
  } */

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteTask(
    @Param() params: FindOneParams,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    const task = await this.findOneOrFail(params.id);
    this.checkTaskOwnership(task, userId);
    return await this.tasksService.deleteTask(task);
  }

  @Post(':id/labels')
  public async addLabels(
    @Param() { id }: FindOneParams,
    @Body() labels: CreateTaskLabelDto[],
    @CurrentUserId() userId: string,
  ): Promise<Task> {
    const task = await this.findOneOrFail(id);
    this.checkTaskOwnership(task, userId);
    return await this.tasksService.addLabels(task, labels);
  }

  @Delete(':id/labels')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async removeLabels(
    @Param() { id }: FindOneParams,
    @Body() labelNames: string[],
    @CurrentUserId() userId: string,
  ): Promise<void> {
    const task = await this.findOneOrFail(id);
    this.checkTaskOwnership(task, userId);
    await this.tasksService.removeLabels(task, labelNames);
  }

  private async findOneOrFail(id: string): Promise<Task> {
    const task = await this.tasksService.findOne(id);
    if (task) {
      return task;
    }
    throw new NotFoundException();
  }

  private checkTaskOwnership(task: Task, userId: string): void {
    if (task.userId !== userId) {
      throw new ForbiddenException('You can only access your own tasks');
    }
  }
}
