/**
 * 讲章引擎管线 (Sermon Engine Pipeline)
 *
 * 将讲章生成流程从线性5阶段升级为可组合、可跳过、可回溯、可并行的管线。
 * 每个阶段是独立的处理器，通过共享上下文串联。
 */

import type { SermonContext } from './sermon-context'

// ─── Types ───────────────────────────────────────────────────────────

/** 管线阶段状态 */
export type StageStatus = 'pending' | 'running' | 'paused' | 'completed' | 'skipped' | 'failed'

/** 阶段处理器类型 */
export type StageProcessorType =
  | 'theme-extractor'     // 从经文提取主题
  | 'outline-builder'     // 生成结构化大纲
  | 'section-generator'   // 按大纲逐段生成
  | 'style-enhancer'      // 修辞润色
  | 'theology-validator'  // 神学检查
  | 'coherence-checker'   // 一致性检查
  | 'final-review'        // 最终审阅

/** 管线阶段定义 */
export interface PipelineStage {
  /** 阶段唯一ID */
  id: string
  /** 阶段名称（中文） */
  nameZh: string
  /** 阶段名称（英文） */
  nameEn: string
  /** 阶段描述 */
  description: string
  /** 处理器类型 */
  processor: StageProcessorType
  /** 当前状态 */
  status: StageStatus
  /** 依赖的前置阶段ID列表 */
  dependencies: string[]
  /** 是否可跳过 */
  skippable: boolean
  /** 阶段输出（完成后填充） */
  output?: string
  /** 错误信息（失败时填充） */
  error?: string
  /** 开始时间 */
  startedAt?: number
  /** 完成时间 */
  completedAt?: number
}

/** 大纲变更策略 */
export type OutlineChangeStrategy =
  | 'regenerate-affected'  // 重新生成受影响的段落
  | 'adjust-existing'      // 调整现有段落以适应新大纲
  | 'mark-outdated'        // 标记为过时，由用户决定

/** 管线事件类型 */
export type PipelineEventType =
  | 'stage-started'
  | 'stage-completed'
  | 'stage-failed'
  | 'stage-skipped'
  | 'stage-paused'
  | 'pipeline-completed'
  | 'pipeline-paused'

/** 管线事件 */
export interface PipelineEvent {
  type: PipelineEventType
  stageId: string
  timestamp: number
  data?: unknown
}

/** 管线状态 */
export interface PipelineState {
  /** 管线ID */
  id: string
  /** 所有阶段 */
  stages: PipelineStage[]
  /** 共享上下文 */
  context: SermonContext
  /** 当前活跃阶段ID */
  activeStageId: string | null
  /** 管线整体状态 */
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed'
  /** 事件日志 */
  events: PipelineEvent[]
}

// ─── Default Pipeline Templates ──────────────────────────────────────

/** 默认5阶段管线（兼容现有 sermon-flow.ts） */
export function createDefaultPipeline(): PipelineStage[] {
  return [
    {
      id: 'theme',
      nameZh: '主题提取',
      nameEn: 'Theme Extraction',
      description: '从经文中提取讲章主题和核心信息',
      processor: 'theme-extractor',
      status: 'pending',
      dependencies: [],
      skippable: false,
    },
    {
      id: 'outline',
      nameZh: '大纲生成',
      nameEn: 'Outline Generation',
      description: '根据主题生成结构化讲章大纲',
      processor: 'outline-builder',
      status: 'pending',
      dependencies: ['theme'],
      skippable: false,
    },
    {
      id: 'draft',
      nameZh: '初稿撰写',
      nameEn: 'Draft Writing',
      description: '按大纲逐段生成讲章初稿',
      processor: 'section-generator',
      status: 'pending',
      dependencies: ['outline'],
      skippable: false,
    },
    {
      id: 'enhance',
      nameZh: '修辞润色',
      nameEn: 'Style Enhancement',
      description: '润色语言，提升表达力和感染力',
      processor: 'style-enhancer',
      status: 'pending',
      dependencies: ['draft'],
      skippable: true,
    },
    {
      id: 'review',
      nameZh: '最终审阅',
      nameEn: 'Final Review',
      description: '审阅全文一致性、神学准确性和结构完整性',
      processor: 'final-review',
      status: 'pending',
      dependencies: ['enhance'],
      skippable: true,
    },
  ]
}

// ─── Pipeline Engine ─────────────────────────────────────────────────

/**
 * 讲章管线引擎
 *
 * 管理管线阶段的执行、状态转换和事件分发。
 * 设计为无副作用的纯状态机，副作用由调用方处理。
 */
export class SermonPipelineEngine {
  private state: PipelineState
  private listeners: Array<(event: PipelineEvent, state: PipelineState) => void> = []

  constructor(initialContext: SermonContext, stages?: PipelineStage[]) {
    this.state = {
      id: `pipeline-${Date.now()}`,
      stages: stages ?? createDefaultPipeline(),
      context: initialContext,
      activeStageId: null,
      status: 'idle',
      events: [],
    }
  }

  /** 获取当前管线状态（不可变快照） */
  getState(): Readonly<PipelineState> {
    return { ...this.state, stages: [...this.state.stages], events: [...this.state.events] }
  }

  /** 订阅管线事件 */
  subscribe(listener: (event: PipelineEvent, state: PipelineState) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  /** 更新共享上下文 */
  updateContext(context: Partial<SermonContext>): void {
    this.state = {
      ...this.state,
      context: { ...this.state.context, ...context },
    }
  }

  /** 获取下一个可执行的阶段 */
  getNextRunnableStage(): PipelineStage | null {
    return this.state.stages.find(stage =>
      stage.status === 'pending' &&
      this.areDependenciesMet(stage.id)
    ) ?? null
  }

  /** 检查阶段依赖是否满足 */
  areDependenciesMet(stageId: string): boolean {
    const stage = this.state.stages.find(s => s.id === stageId)
    if (!stage) return false

    return stage.dependencies.every(depId => {
      const dep = this.state.stages.find(s => s.id === depId)
      return dep?.status === 'completed' || dep?.status === 'skipped'
    })
  }

  /** 开始执行一个阶段 */
  startStage(stageId: string): void {
    const stage = this.state.stages.find(s => s.id === stageId)
    if (!stage) return
    if (stage.status !== 'pending' && stage.status !== 'paused') return
    if (!this.areDependenciesMet(stageId)) return

    this.state = {
      ...this.state,
      activeStageId: stageId,
      status: 'running',
      stages: this.state.stages.map(s =>
        s.id === stageId
          ? { ...s, status: 'running' as StageStatus, startedAt: Date.now() }
          : s
      ),
    }

    this.emitEvent({
      type: 'stage-started',
      stageId,
      timestamp: Date.now(),
    })
  }

  /** 完成一个阶段 */
  completeStage(stageId: string, output?: string): void {
    this.state = {
      ...this.state,
      stages: this.state.stages.map(s =>
        s.id === stageId
          ? { ...s, status: 'completed' as StageStatus, output, completedAt: Date.now() }
          : s
      ),
      activeStageId: null,
    }

    this.emitEvent({
      type: 'stage-completed',
      stageId,
      timestamp: Date.now(),
      data: output,
    })

    // 检查管线是否全部完成
    const allDone = this.state.stages.every(
      s => s.status === 'completed' || s.status === 'skipped'
    )
    if (allDone) {
      this.state = { ...this.state, status: 'completed' }
      this.emitEvent({
        type: 'pipeline-completed',
        stageId: '',
        timestamp: Date.now(),
      })
    }
  }

  /** 阶段执行失败 */
  failStage(stageId: string, error: string): void {
    this.state = {
      ...this.state,
      stages: this.state.stages.map(s =>
        s.id === stageId
          ? { ...s, status: 'failed' as StageStatus, error }
          : s
      ),
      activeStageId: null,
      status: 'failed',
    }

    this.emitEvent({
      type: 'stage-failed',
      stageId,
      timestamp: Date.now(),
      data: error,
    })
  }

  /** 跳过一个阶段 */
  skipStage(stageId: string): void {
    const stage = this.state.stages.find(s => s.id === stageId)
    if (!stage?.skippable) return

    this.state = {
      ...this.state,
      stages: this.state.stages.map(s =>
        s.id === stageId
          ? { ...s, status: 'skipped' as StageStatus, completedAt: Date.now() }
          : s
      ),
    }

    this.emitEvent({
      type: 'stage-skipped',
      stageId,
      timestamp: Date.now(),
    })
  }

  /** 暂停当前阶段 */
  pauseStage(stageId: string): void {
    this.state = {
      ...this.state,
      stages: this.state.stages.map(s =>
        s.id === stageId
          ? { ...s, status: 'paused' as StageStatus }
          : s
      ),
      activeStageId: null,
      status: 'paused',
    }

    this.emitEvent({
      type: 'stage-paused',
      stageId,
      timestamp: Date.now(),
    })
  }

  /** 回溯：将指定阶段及其下游重置为 pending */
  rollbackTo(stageId: string): void {
    const stageIndex = this.state.stages.findIndex(s => s.id === stageId)
    if (stageIndex === -1) return

    this.state = {
      ...this.state,
      stages: this.state.stages.map((s, idx) =>
        idx >= stageIndex
          ? { ...s, status: 'pending' as StageStatus, output: undefined, error: undefined, startedAt: undefined, completedAt: undefined }
          : s
      ),
      activeStageId: null,
      status: 'idle',
    }
  }

  /** 获取阶段进度百分比 */
  getProgress(): number {
    const total = this.state.stages.length
    const completed = this.state.stages.filter(
      s => s.status === 'completed' || s.status === 'skipped'
    ).length
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  /** 获取指定阶段的输出 */
  getStageOutput(stageId: string): string | undefined {
    return this.state.stages.find(s => s.id === stageId)?.output
  }

  /** 发射事件 */
  private emitEvent(event: PipelineEvent): void {
    this.state = {
      ...this.state,
      events: [...this.state.events, event],
    }
    const snapshot = this.getState()
    this.listeners.forEach(listener => listener(event, snapshot))
  }
}
