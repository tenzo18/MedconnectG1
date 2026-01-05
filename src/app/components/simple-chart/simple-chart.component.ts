import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

@Component({
  selector: 'app-simple-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-full">
      <!-- Bar Chart -->
      <div *ngIf="type === 'bar'" class="space-y-3">
        <div *ngFor="let item of data" class="flex items-center gap-3">
          <div class="w-20 text-sm text-dark-gray/60 dark:text-white/60 text-right">{{ item.label }}</div>
          <div class="flex-1 bg-gray-200 dark:bg-dark-gray/20 rounded-full h-2 relative overflow-hidden">
            <div class="h-full rounded-full transition-all duration-1000 ease-out"
                 [style.width.%]="getPercentage(item.value)"
                 [style.background-color]="item.color || '#005A9C'">
            </div>
          </div>
          <div class="w-12 text-sm font-semibold text-dark-gray dark:text-white text-right">{{ item.value }}</div>
        </div>
      </div>

      <!-- Donut Chart -->
      <div *ngIf="type === 'donut'" class="flex items-center justify-center">
        <div class="relative w-32 h-32">
          <svg #donutChart class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke="#e5e7eb" 
                    stroke-width="8"/>
            <circle *ngFor="let item of data; let i = index"
                    cx="50" cy="50" r="40"
                    fill="none"
                    [attr.stroke]="item.color || getDefaultColor(i)"
                    stroke-width="8"
                    [attr.stroke-dasharray]="getStrokeDashArray(item.value)"
                    [attr.stroke-dashoffset]="getStrokeDashOffsetForIndex(i)"
                    class="transition-all duration-1000 ease-out"
                    stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <div class="text-lg font-bold text-dark-gray dark:text-white">{{ getTotalValue() }}</div>
              <div class="text-xs text-dark-gray/60 dark:text-white/60">Total</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Line Chart (Simple) -->
      <div *ngIf="type === 'line'" class="relative h-24">
        <svg class="w-full h-full" viewBox="0 0 300 100">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#4F7CFF;stop-opacity:0.3"/>
              <stop offset="100%" style="stop-color:#4F7CFF;stop-opacity:0"/>
            </linearGradient>
          </defs>
          
          <!-- Area under the line -->
          <path [attr.d]="getAreaPath()" fill="url(#lineGradient)" opacity="0.5"/>
          
          <!-- Line -->
          <path [attr.d]="getLinePath()" 
                fill="none" 
                stroke="#4F7CFF" 
                stroke-width="2" 
                stroke-linecap="round"
                class="transition-all duration-1000 ease-out"/>
          
          <!-- Data points -->
          <circle *ngFor="let item of data; let i = index"
                  [attr.cx]="getXPosition(i)"
                  [attr.cy]="getYPosition(item.value)"
                  r="3"
                  fill="#4F7CFF"
                  class="transition-all duration-1000 ease-out"/>
        </svg>
      </div>

      <!-- Legend -->
      <div *ngIf="showLegend && type !== 'line'" class="mt-4 flex flex-wrap gap-3">
        <div *ngFor="let item of data; let i = index" class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full" 
               [style.background-color]="item.color || getDefaultColor(i)"></div>
          <span class="text-sm text-dark-gray/60 dark:text-white/60">{{ item.label }}</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./simple-chart.component.scss']
})
export class SimpleChartComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() type: 'bar' | 'donut' | 'line' = 'bar';
  @Input() data: ChartData[] = [];
  @Input() showLegend: boolean = true;
  @ViewChild('donutChart') donutChart?: ElementRef<SVGElement>;

  private maxValue: number = 0;
  private colors = ['#4F7CFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  ngOnInit() {
    this.calculateMaxValue();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.calculateMaxValue();
    }
  }

  private calculateMaxValue() {
    if (this.data && this.data.length > 0) {
      this.maxValue = Math.max(...this.data.map(item => item.value));
    } else {
      this.maxValue = 0;
    }
  }

  ngAfterViewInit() {
    // Animation delay for charts
    setTimeout(() => {
      if (this.donutChart) {
        this.animateDonutChart();
      }
    }, 100);
  }

  getPercentage(value: number): number {
    return this.maxValue > 0 ? (value / this.maxValue) * 100 : 0;
  }

  getTotalValue(): number {
    return this.data.reduce((sum, item) => sum + item.value, 0);
  }

  getDefaultColor(index: number): string {
    return this.colors[index % this.colors.length];
  }

  // Donut chart methods
  getCircumference(): number {
    const radius = 40;
    return 2 * Math.PI * radius;
  }

  getStrokeDashArray(value: number): string {
    const circumference = this.getCircumference();
    const total = this.getTotalValue();
    if (total === 0) return `0 ${circumference}`;

    const percentage = value / total;
    const dashLength = percentage * circumference;
    return `${dashLength} ${circumference}`;
  }

  getStrokeDashOffsetForIndex(index: number): number {
    const circumference = this.getCircumference();
    const total = this.getTotalValue();
    if (total === 0) return 0;

    let previousValuesSum = 0;
    for (let i = 0; i < index; i++) {
      previousValuesSum += this.data[i].value;
    }

    // SVG stroke-dashoffset moves strictly backward (negative) to advance the dash forward
    return -(previousValuesSum / total) * circumference;
  }

  // Line chart methods
  getLinePath(): string {
    if (this.data.length === 0) return '';

    let path = `M ${this.getXPosition(0)} ${this.getYPosition(this.data[0].value)}`;

    for (let i = 1; i < this.data.length; i++) {
      path += ` L ${this.getXPosition(i)} ${this.getYPosition(this.data[i].value)}`;
    }

    return path;
  }

  getAreaPath(): string {
    if (this.data.length === 0) return '';

    let path = `M ${this.getXPosition(0)} 100`;
    path += ` L ${this.getXPosition(0)} ${this.getYPosition(this.data[0].value)}`;

    for (let i = 1; i < this.data.length; i++) {
      path += ` L ${this.getXPosition(i)} ${this.getYPosition(this.data[i].value)}`;
    }

    path += ` L ${this.getXPosition(this.data.length - 1)} 100 Z`;

    return path;
  }

  getXPosition(index: number): number {
    const width = 300;
    const padding = 20;
    const availableWidth = width - (2 * padding);

    if (this.data.length === 1) return width / 2;

    return padding + (index / (this.data.length - 1)) * availableWidth;
  }

  getYPosition(value: number): number {
    const height = 100;
    const padding = 10;
    const availableHeight = height - (2 * padding);

    if (this.maxValue === 0) return height - padding;

    return height - padding - (value / this.maxValue) * availableHeight;
  }

  private animateDonutChart() {
    // Add animation classes or trigger animations
  }
}