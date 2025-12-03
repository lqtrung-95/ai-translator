import { Injectable } from '@nestjs/common';
import { GlossaryTerm } from './entities/glossary-term.entity';

@Injectable()
export class GlossaryService {
  // Mock 数据：AWS 和 GCP 常见术语
  private mockTerms: Partial<GlossaryTerm>[] = [
    // AWS Terms
    {
      id: 'aws-1',
      english: 'EC2 (Elastic Compute Cloud)',
      chinese: '弹性计算云',
      category: 'AWS Compute',
      explanation: 'Amazon EC2 是一种 Web 服务，可在云中提供安全且可调整大小的计算容量。',
      examples: ['Launch an EC2 instance to host your web application.'],
    },
    {
      id: 'aws-2',
      english: 'S3 (Simple Storage Service)',
      chinese: '简单存储服务',
      category: 'AWS Storage',
      explanation: 'Amazon S3 是一种对象存储服务，提供行业领先的可扩展性、数据可用性、安全性和性能。',
      examples: ['Store your static assets in an S3 bucket.'],
    },
    {
      id: 'aws-3',
      english: 'AWS Lambda',
      chinese: 'AWS Lambda',
      category: 'AWS Compute',
      explanation: 'AWS Lambda 是一项无服务器计算服务，可让您运行代码而无需预置或管理服务器。',
      examples: ['Use Lambda to process data automatically when it is uploaded to S3.'],
    },
    {
      id: 'aws-4',
      english: 'RDS (Relational Database Service)',
      chinese: '关系数据库服务',
      category: 'AWS Database',
      explanation: 'Amazon RDS 是一项托管服务，可让您在云中轻松设置、操作和扩展关系数据库。',
      examples: ['Deploy a PostgreSQL database using RDS.'],
    },
    {
      id: 'aws-5',
      english: 'VPC (Virtual Private Cloud)',
      chinese: '虚拟私有云',
      category: 'AWS Networking',
      explanation: 'Amazon VPC 允许您预置 AWS 云的一个逻辑隔离部分，您可以在其中启动您定义的虚拟网络中的 AWS 资源。',
      examples: ['Configure your VPC with public and private subnets.'],
    },
    {
      id: 'aws-6',
      english: 'IAM (Identity and Access Management)',
      chinese: '身份与访问管理',
      category: 'AWS Security',
      explanation: 'AWS IAM 是一项 Web 服务，可帮助您安全地控制对 AWS 资源的访问。',
      examples: ['Create an IAM role with least privilege permissions.'],
    },
    {
      id: 'aws-7',
      english: 'CloudFront',
      chinese: 'CloudFront',
      category: 'AWS Networking',
      explanation: 'Amazon CloudFront 是一项快速内容分发网络 (CDN) 服务，可以安全地以低延迟和高传输速度向全球客户分发数据、视频、应用程序和 API。',
      examples: ['Use CloudFront to cache your website content closer to users.'],
    },
    {
      id: 'aws-8',
      english: 'DynamoDB',
      chinese: 'DynamoDB',
      category: 'AWS Database',
      explanation: 'Amazon DynamoDB 是一种键值和文档数据库，可在任何规模下提供个位数毫秒级的性能。',
      examples: ['Store user session data in DynamoDB for fast access.'],
    },
    {
      id: 'aws-9',
      english: 'CloudWatch',
      chinese: 'CloudWatch',
      category: 'AWS Management',
      explanation: 'Amazon CloudWatch 是一项针对 DevOps 工程师、开发人员、站点可靠性工程师 (SRE) 和 IT 经理的监控和可观测性服务。',
      examples: ['Set up CloudWatch Alarms to monitor CPU usage.'],
    },
    {
      id: 'aws-10',
      english: 'CloudFormation',
      chinese: 'CloudFormation',
      category: 'AWS Management',
      explanation: 'AWS CloudFormation 是一项服务，可帮助您对 AWS 资源进行建模和设置，以便您可以花更少的时间管理这些资源，而将更多的时间用于专注于在 AWS 中运行的应用程序。',
      examples: ['Define your infrastructure as code using CloudFormation templates.'],
    },

    // GCP Terms
    {
      id: 'gcp-1',
      english: 'Compute Engine',
      chinese: '计算引擎',
      category: 'GCP Compute',
      explanation: 'Compute Engine 是 Google Cloud 上安全且可自定义的计算服务，可让您创建和运行虚拟机。',
      examples: ['Create a Compute Engine VM instance.'],
    },
    {
      id: 'gcp-2',
      english: 'Cloud Storage',
      chinese: '云存储',
      category: 'GCP Storage',
      explanation: 'Cloud Storage 是 Google Cloud 上用于存储非结构化数据的托管服务。',
      examples: ['Upload files to a Cloud Storage bucket.'],
    },
    {
      id: 'gcp-3',
      english: 'BigQuery',
      chinese: 'BigQuery',
      category: 'GCP Analytics',
      explanation: 'BigQuery 是 Google Cloud 的完全托管式无服务器企业数据仓库。',
      examples: ['Run SQL queries on massive datasets using BigQuery.'],
    },
    {
      id: 'gcp-4',
      english: 'GKE (Google Kubernetes Engine)',
      chinese: 'Google Kubernetes Engine',
      category: 'GCP Compute',
      explanation: 'GKE 是 Google Cloud 上的托管 Kubernetes 服务，用于部署、管理和扩展容器化应用程序。',
      examples: ['Deploy your microservices cluster on GKE.'],
    },
    {
      id: 'gcp-5',
      english: 'App Engine',
      chinese: 'App Engine',
      category: 'GCP Compute',
      explanation: 'App Engine 是 Google Cloud 上的完全托管式无服务器平台，用于构建和部署高度可扩展的应用程序。',
      examples: ['Deploy your web app to App Engine without managing servers.'],
    },
    {
      id: 'gcp-6',
      english: 'Cloud Functions',
      chinese: 'Cloud Functions',
      category: 'GCP Compute',
      explanation: 'Cloud Functions 是 Google Cloud 上的轻量级计算解决方案，供开发者创建单一用途的独立函数，以响应云事件，而无需管理服务器或运行时环境。',
      examples: ['Trigger a Cloud Function when a file is uploaded.'],
    },
    {
      id: 'gcp-7',
      english: 'Cloud Pub/Sub',
      chinese: 'Cloud Pub/Sub',
      category: 'GCP Analytics',
      explanation: 'Pub/Sub 是一种异步消息传递服务，可将生成消息的服务与处理这些消息的服务分离开来。',
      examples: ['Use Pub/Sub for event-driven architecture.'],
    },
    {
      id: 'gcp-8',
      english: 'Cloud Spanner',
      chinese: 'Cloud Spanner',
      category: 'GCP Database',
      explanation: 'Cloud Spanner 是一种完全托管式关系数据库，具有无限的横向扩展能力、强一致性和高达 99.999% 的可用性。',
      examples: ['Use Spanner for global applications requiring strong consistency.'],
    },
    {
      id: 'gcp-9',
      english: 'Cloud Run',
      chinese: 'Cloud Run',
      category: 'GCP Compute',
      explanation: 'Cloud Run 是一种完全托管式计算平台，可让您直接在 Google 可扩展的基础架构之上运行容器。',
      examples: ['Deploy your containerized API to Cloud Run.'],
    },
    {
      id: 'gcp-10',
      english: 'Vertex AI',
      chinese: 'Vertex AI',
      category: 'GCP AI/ML',
      explanation: 'Vertex AI 是 Google Cloud 上的机器学习平台，可让您构建、部署和扩展机器学习模型。',
      examples: ['Train and deploy ML models using Vertex AI.'],
    },

    // General Cloud Terms
    {
      id: 'gen-1',
      english: 'Load Balancer',
      chinese: '负载均衡器',
      category: 'Networking',
      explanation: '负载均衡器在多个计算资源（如虚拟机）之间分配传入的应用程序流量。',
      examples: ['Configure a Load Balancer to distribute traffic across instances.'],
    },
    {
      id: 'gen-2',
      english: 'Auto Scaling',
      chinese: '自动伸缩',
      category: 'Compute',
      explanation: '自动伸缩是一种云计算功能，可根据当前的负载需求自动调整计算资源的数量。',
      examples: ['Enable Auto Scaling to handle traffic spikes.'],
    },
    {
      id: 'gen-3',
      english: 'Availability Zone (AZ)',
      chinese: '可用区',
      category: 'Infrastructure',
      explanation: '可用区是区域内的隔离位置，旨在提供高可用性和容错能力。',
      examples: ['Deploy resources across multiple AZs for high availability.'],
    },
    {
      id: 'gen-4',
      english: 'Region',
      chinese: '区域',
      category: 'Infrastructure',
      explanation: '区域是云服务提供商数据中心的地理位置集合。',
      examples: ['Select the Region closest to your users to reduce latency.'],
    },
    {
      id: 'gen-5',
      english: 'Text-to-Speech',
      chinese: '文本转语音',
      category: 'AI/ML',
      explanation: '文本转语音 (TTS) 是一种辅助技术，可大声朗读数字文本。',
      examples: ['Use Text-to-Speech API to generate audio from text.'],
    }
  ];

  async findAll(limit: number = 100, offset: number = 0): Promise<{ terms: Partial<GlossaryTerm>[]; total: number }> {
    // 模拟分页
    const start = offset;
    const end = offset + limit;
    const terms = this.mockTerms.slice(start, end);

    return {
      terms,
      total: this.mockTerms.length,
    };
  }

  async search(query: string): Promise<Partial<GlossaryTerm>[]> {
    const lowerQuery = query.toLowerCase();
    return this.mockTerms.filter(
      (term) =>
        term.english.toLowerCase().includes(lowerQuery) ||
        term.chinese.includes(lowerQuery) ||
        term.explanation.toLowerCase().includes(lowerQuery)
    );
  }

  async create(term: Partial<GlossaryTerm>): Promise<GlossaryTerm> {
    const newTerm = {
      ...term,
      id: `custom-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as GlossaryTerm;

    this.mockTerms.unshift(newTerm);
    return newTerm;
  }
}
