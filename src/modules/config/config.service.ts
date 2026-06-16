import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service'; // اسم وتراك الـ service عندك

@Injectable()
export class ConfigurationService {
  private readonly logger = new Logger(ConfigurationService.name);

  constructor(private prisma: PrismaService) {}
  async getWelcomeConfig() {
    try {
      const config = await this.prisma.welcomeConfig.findFirst({
        include: {
          banners: true,
        },
      });

      if (!config) {
        return this.getFallbackConfig();
      }

      return {
        logoUrl: config.logoUrl,
        banners: config.banners.map((b) => ({
          imageUrl: b.imageUrl,
          title: b.title,
          description: b.description,
        })),
        supportPhone: config.supportPhone,
        features: {
          googleAuthEnabled: config.googleAuthEnabled,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Database error, serving fallback: ${error.message}`);
      }
      return this.getFallbackConfig();
    }
  }

  private getFallbackConfig() {
    return {
      logoUrl: 'https://cdn.mycompany.com/assets/logo-fallback.png',
      banners: [
        {
          imageUrl: 'https://cdn.mycompany.com/assets/banner1-fallback.png',
          title: 'Welcome to Our Premium App',
          description: 'Explore our amazing features right now.',
        },
      ],
      supportPhone: '+1234567890',
      features: {
        googleAuthEnabled: true,
      },
    };
  }
}
