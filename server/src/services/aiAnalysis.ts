// AI analysis service using OpenAI GPT

import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../utils/logger';
import {
  MeetingAnalysis,
  TranscriptSegment,
  ActionItem,
  Topic,
  SentimentAnalysis,
  JargonTerm,
  Insight,
  AnalysisType,
  Priority,
  ActionItemStatus,
  InsightType,
  generateId
} from '@ai-meeting-companion/shared';

export class AIAnalysisService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
  }

  /**
   * Analyze meeting transcript segments
   */
  async analyzeTranscript(
    sessionId: string,
    segments: TranscriptSegment[],
    analysisTypes: AnalysisType[] = [
      AnalysisType.SUMMARY,
      AnalysisType.ACTION_ITEMS,
      AnalysisType.SENTIMENT,
      AnalysisType.JARGON
    ]
  ): Promise<Partial<MeetingAnalysis>> {
    try {
      const startTime = Date.now();
      const fullText = segments.map(s => s.text).join(' ');

      if (!fullText.trim()) {
        return this.getEmptyAnalysis(sessionId);
      }

      const analysis: Partial<MeetingAnalysis> = {
        sessionId,
        generatedAt: new Date()
      };

      // Run analyses in parallel for better performance
      const promises: Promise<void>[] = [];

      if (analysisTypes.includes(AnalysisType.SUMMARY)) {
        promises.push(this.generateSummary(fullText).then(summary => {
          analysis.summary = summary;
        }));
      }

      if (analysisTypes.includes(AnalysisType.ACTION_ITEMS)) {
        promises.push(this.extractActionItems(fullText).then(actionItems => {
          analysis.actionItems = actionItems;
        }));
      }

      if (analysisTypes.includes(AnalysisType.SENTIMENT)) {
        promises.push(this.analyzeSentiment(segments).then(sentiment => {
          analysis.sentiment = sentiment;
        }));
      }

      if (analysisTypes.includes(AnalysisType.JARGON)) {
        promises.push(this.detectJargon(fullText).then(jargonTerms => {
          analysis.jargonTerms = jargonTerms;
        }));
      }

      if (analysisTypes.includes(AnalysisType.TOPICS)) {
        promises.push(this.extractTopics(fullText, segments).then(topics => {
          analysis.keyTopics = topics;
        }));
      }

      if (analysisTypes.includes(AnalysisType.INSIGHTS)) {
        promises.push(this.generateInsights(fullText).then(insights => {
          analysis.insights = insights;
        }));
      }

      await Promise.all(promises);

      const processingTime = Date.now() - startTime;
      logger.info(`Analysis completed in ${processingTime}ms`, {
        sessionId,
        analysisTypes,
        textLength: fullText.length,
        segmentCount: segments.length
      });

      return analysis;

    } catch (error) {
      logger.error('Analysis failed:', error);
      throw new Error(`Analysis failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate meeting summary
   */
  private async generateSummary(text: string): Promise<string> {
    const prompt = `
Please provide a concise summary of this meeting transcript. Focus on:
- Key discussion points
- Important decisions made
- Main outcomes
- Next steps mentioned

Keep the summary to 3-5 sentences and make it actionable.

Transcript:
${text}
`;

    const response = await this.openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert meeting analyst. Provide clear, concise summaries that capture the essence of meetings.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: config.openai.temperature
    });

    return response.choices[0]?.message?.content?.trim() || 'No summary available';
  }

  /**
   * Extract action items from text
   */
  private async extractActionItems(text: string): Promise<ActionItem[]> {
    const prompt = `
Extract action items from this meeting transcript. For each action item, identify:
- The specific task or action
- Who is responsible (if mentioned)
- Any deadline or timeframe (if mentioned)
- Priority level (high, medium, low)

Return the result as a JSON array with this structure:
[
  {
    "text": "action description",
    "assignee": "person name or null",
    "dueDate": "ISO date string or null",
    "priority": "high|medium|low",
    "context": "relevant context from transcript"
  }
]

Transcript:
${text}
`;

    const response = await this.openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at identifying action items from meeting transcripts. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });

    try {
      const content = response.choices[0]?.message?.content?.trim();
      if (!content) return [];

      const parsed = JSON.parse(content);
      
      return parsed.map((item: any) => ({
        id: generateId(),
        text: item.text || '',
        assignee: item.assignee || undefined,
        dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
        priority: this.mapPriority(item.priority),
        status: ActionItemStatus.PENDING,
        extractedAt: new Date(),
        context: item.context || undefined
      }));

    } catch (error) {
      logger.warn('Failed to parse action items JSON:', error);
      return [];
    }
  }

  /**
   * Analyze sentiment of transcript segments
   */
  private async analyzeSentiment(segments: TranscriptSegment[]): Promise<SentimentAnalysis> {
    const fullText = segments.map(s => s.text).join(' ');

    const prompt = `
Analyze the sentiment of this meeting transcript. Provide:
1. Overall sentiment scores (positive, neutral, negative) as percentages that sum to 100
2. A compound score from -1 (very negative) to 1 (very positive)

Return as JSON:
{
  "overall": {
    "positive": number,
    "neutral": number,
    "negative": number,
    "compound": number
  }
}

Transcript:
${fullText}
`;

    const response = await this.openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert sentiment analyst. Analyze meeting sentiment objectively and return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.1
    });

    try {
      const content = response.choices[0]?.message?.content?.trim();
      if (!content) throw new Error('No response content');

      const parsed = JSON.parse(content);
      
      return {
        overall: {
          positive: parsed.overall.positive / 100,
          neutral: parsed.overall.neutral / 100,
          negative: parsed.overall.negative / 100,
          compound: parsed.overall.compound
        },
        timeline: [], // TODO: Implement timeline analysis
        participants: [] // TODO: Implement per-participant analysis
      };

    } catch (error) {
      logger.warn('Failed to parse sentiment JSON:', error);
      return {
        overall: { positive: 0.5, neutral: 0.5, negative: 0, compound: 0 },
        timeline: [],
        participants: []
      };
    }
  }

  /**
   * Detect jargon and provide explanations
   */
  private async detectJargon(text: string): Promise<JargonTerm[]> {
    const prompt = `
Identify technical jargon, acronyms, and specialized terms in this meeting transcript that might need explanation. For each term, provide a clear, simple definition.

Return as JSON array:
[
  {
    "term": "technical term",
    "definition": "simple explanation",
    "category": "technology|business|industry|other",
    "confidence": 0.8
  }
]

Only include terms that are genuinely technical or specialized, not common business words.

Transcript:
${text}
`;

    const response = await this.openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at identifying and explaining technical jargon. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.2
    });

    try {
      const content = response.choices[0]?.message?.content?.trim();
      if (!content) return [];

      const parsed = JSON.parse(content);
      
      return parsed.map((item: any) => ({
        term: item.term || '',
        definition: item.definition || '',
        category: item.category || 'other',
        confidence: item.confidence || 0.5,
        occurrences: this.countOccurrences(text, item.term),
        context: this.extractContext(text, item.term)
      }));

    } catch (error) {
      logger.warn('Failed to parse jargon JSON:', error);
      return [];
    }
  }

  /**
   * Extract key topics from transcript
   */
  private async extractTopics(text: string, segments: TranscriptSegment[]): Promise<Topic[]> {
    const prompt = `
Identify the main topics discussed in this meeting transcript. For each topic, provide:
- Topic name
- Key keywords related to the topic
- Relevance score (0-1)

Return as JSON array:
[
  {
    "name": "topic name",
    "keywords": ["keyword1", "keyword2"],
    "relevanceScore": 0.8
  }
]

Transcript:
${text}
`;

    const response = await this.openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at topic extraction from meeting transcripts. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.2
    });

    try {
      const content = response.choices[0]?.message?.content?.trim();
      if (!content) return [];

      const parsed = JSON.parse(content);
      
      return parsed.map((item: any) => ({
        id: generateId(),
        name: item.name || '',
        keywords: item.keywords || [],
        relevanceScore: item.relevanceScore || 0.5,
        timeSpent: this.calculateTopicTime(text, item.keywords),
        segments: this.findRelevantSegments(segments, item.keywords)
      }));

    } catch (error) {
      logger.warn('Failed to parse topics JSON:', error);
      return [];
    }
  }

  /**
   * Generate insights from transcript
   */
  private async generateInsights(text: string): Promise<Insight[]> {
    const prompt = `
Generate actionable insights from this meeting transcript. Look for:
- Important decisions made
- Potential risks or concerns raised
- Opportunities identified
- Blockers or challenges mentioned
- Follow-up items needed

Return as JSON array:
[
  {
    "type": "decision|concern|opportunity|risk|follow_up|blocker",
    "title": "brief title",
    "description": "detailed description",
    "confidence": 0.8,
    "actionable": true
  }
]

Transcript:
${text}
`;

    const response = await this.openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert business analyst. Generate actionable insights from meeting discussions. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    try {
      const content = response.choices[0]?.message?.content?.trim();
      if (!content) return [];

      const parsed = JSON.parse(content);
      
      return parsed.map((item: any) => ({
        type: this.mapInsightType(item.type),
        title: item.title || '',
        description: item.description || '',
        confidence: item.confidence || 0.5,
        relevantSegments: [], // TODO: Implement segment mapping
        actionable: item.actionable || false
      }));

    } catch (error) {
      logger.warn('Failed to parse insights JSON:', error);
      return [];
    }
  }

  // Helper methods

  private getEmptyAnalysis(sessionId: string): Partial<MeetingAnalysis> {
    return {
      sessionId,
      summary: 'No content to analyze',
      actionItems: [],
      keyTopics: [],
      sentiment: {
        overall: { positive: 0, neutral: 1, negative: 0, compound: 0 },
        timeline: [],
        participants: []
      },
      jargonTerms: [],
      insights: [],
      generatedAt: new Date()
    };
  }

  private mapPriority(priority: string): Priority {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return Priority.HIGH;
      case 'medium':
        return Priority.MEDIUM;
      case 'low':
        return Priority.LOW;
      default:
        return Priority.MEDIUM;
    }
  }

  private mapInsightType(type: string): InsightType {
    switch (type?.toLowerCase()) {
      case 'decision':
        return InsightType.DECISION;
      case 'concern':
        return InsightType.CONCERN;
      case 'opportunity':
        return InsightType.OPPORTUNITY;
      case 'risk':
        return InsightType.RISK;
      case 'follow_up':
        return InsightType.FOLLOW_UP;
      case 'blocker':
        return InsightType.BLOCKER;
      default:
        return InsightType.FOLLOW_UP;
    }
  }

  private countOccurrences(text: string, term: string): number {
    const regex = new RegExp(term, 'gi');
    return (text.match(regex) || []).length;
  }

  private extractContext(text: string, term: string): string[] {
    const sentences = text.split(/[.!?]+/);
    return sentences
      .filter(sentence => sentence.toLowerCase().includes(term.toLowerCase()))
      .map(sentence => sentence.trim())
      .slice(0, 3); // Return up to 3 context sentences
  }

  private calculateTopicTime(text: string, keywords: string[]): number {
    // Rough estimation based on keyword density
    const totalWords = text.split(/\s+/).length;
    const keywordCount = keywords.reduce((count, keyword) => {
      return count + this.countOccurrences(text, keyword);
    }, 0);
    
    return (keywordCount / totalWords) * 100; // Percentage
  }

  private findRelevantSegments(segments: TranscriptSegment[], keywords: string[]): string[] {
    return segments
      .filter(segment => 
        keywords.some(keyword => 
          segment.text.toLowerCase().includes(keyword.toLowerCase())
        )
      )
      .map(segment => segment.id);
  }
}
