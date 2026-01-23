import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';
import thirdPartyConfig from '../../config/third-party.config';

/**
 * Whitelisted Paystack IPs
 */
const WHITELISTED_IPS = ['52.31.139.75', '52.49.173.169', '52.214.14.220'];

@Injectable()
export class PaystackGuard implements CanActivate {
  constructor(
    @Inject(thirdPartyConfig.KEY)
    private readonly thirdpartyConfig: ConfigType<typeof thirdPartyConfig>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Validate IP address
    this.validateIP(request);

    // Validate Paystack signature
    this.validateSignature(request);

    return true;
  }

  /**
   * Validate that the request comes from a whitelisted Paystack IP
   */
  private validateIP(request: Request): void {
    let clientIP: string;

    // Handle ngrok tunneling
    if (request.hostname?.includes('ngrok')) {
      const forwardedIP = request.headers['x-forwarded-for'] as string;
      if (!forwardedIP) {
        throw new UnauthorizedException('Access Unauthorized');
      }

      // The forwarded IP returns as comma-separated string where original IP is first
      const forwardedIPs = forwardedIP.split(', ');
      clientIP = forwardedIPs[0];
    } else {
      // Get client IP from headers or request
      const xRealIP = request.headers['x-real-ip'] as string;
      const xForwardedFor = request.headers['x-forwarded-for'] as string;
      clientIP = xRealIP || xForwardedFor || (request.ip as string);
    }

    // Check if IP is whitelisted
    if (!WHITELISTED_IPS.includes(clientIP)) {
      throw new UnauthorizedException('Access Unauthorized');
    }
  }

  /**
   * Validate the Paystack webhook signature
   */
  private validateSignature(request: Request): void {
    const paystackSecretKey = this.thirdpartyConfig.paystack.paystackSecretKey;

    if (!paystackSecretKey) {
      throw new UnauthorizedException('Paystack secret key not configured');
    }

    // Get raw body - NestJS stores it in request.rawBody when configured
    const rawBody = (request as any).rawBody;

    if (!rawBody) {
      throw new UnauthorizedException(
        'Raw body not available for signature verification',
      );
    }

    // Generate hash from raw request body
    const hash = crypto
      .createHmac('sha512', paystackSecretKey)
      .update(rawBody)
      .digest('hex');

    // Compare with Paystack signature
    const paystackSignature = request.headers['x-paystack-signature'] as string;

    if (hash !== paystackSignature) {
      throw new UnauthorizedException('Invalid Paystack signature');
    }
  }
}
