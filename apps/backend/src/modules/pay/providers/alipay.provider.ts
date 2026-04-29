import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import type {
  PaymentProvider,
  CreatePaymentParams,
  PaymentResult,
  CallbackVerification,
} from './payment-provider.interface';
import { AlipaySdk } from 'alipay-sdk';

@Injectable()
export class AlipayProvider implements PaymentProvider {
  private readonly logger = new Logger(AlipayProvider.name);
  private readonly client: any = null;

  constructor() {
    const appId = process.env.ALIPAY_APP_ID;
    const privateKey = process.env.ALIPAY_PRIVATE_KEY;
    const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY;

    if (appId && privateKey && alipayPublicKey) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        this.client = new (AlipaySdk as any)({
          appId,
          privateKey,
          alipayPublicKey,
          gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
          signType: process.env.ALIPAY_SIGN_TYPE || 'RSA2',
        });
        this.logger.log('支付宝 SDK 已初始化');
      } catch (e) {
        console.error(e);
        this.logger.warn('支付宝 SDK 加载失败，将使用模拟模式');
      }
    } else {
      this.logger.warn('支付宝配置不完整，将使用模拟模式');
    }
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    if (!this.client) {
      return this.createMockPayment(params);
    }

    try {
      const result = await this.client.exec('alipay.trade.page.pay', {
        bizContent: {
          out_trade_no: params.orderNo,
          product_code: 'FAST_INSTANT_TRADE_PAY',
          total_amount: (params.amount / 100).toFixed(2),
          subject: params.subject,
          body: params.body || params.subject,
        },
        notifyUrl: params.notifyUrl,
        returnUrl: params.returnUrl,
      });

      return {
        success: true,
        payUrl: result,
      };
    } catch (error) {
      this.logger.error('支付宝创建支付失败', error);
      return { success: false };
    }
  }

  async verifyCallback(params: Record<string, any>): Promise<CallbackVerification> {
    if (!this.client) {
      return this.verifyMockCallback(params);
    }

    try {
      const signVerified = this.client.checkNotifySign(params);
      if (!signVerified) {
        return { success: false, orderNo: '', paymentRef: '', amount: 0, rawData: params };
      }

      const tradeStatus = params.trade_status;
      if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
        return { success: false, orderNo: '', paymentRef: '', amount: 0, rawData: params };
      }

      return {
        success: true,
        orderNo: params.out_trade_no,
        paymentRef: params.trade_no,
        amount: Math.round(parseFloat(params.total_amount || '0') * 100),
        rawData: params,
      };
    } catch (error) {
      this.logger.error('支付宝回调验证失败', error);
      return { success: false, orderNo: '', paymentRef: '', amount: 0, rawData: params };
    }
  }

  private async createMockPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    this.logger.log(`[Mock 支付宝] 创建支付: ${params.orderNo}, ¥${(params.amount / 100).toFixed(2)}`);
    return {
      success: true,
      payUrl: `/api/pay/mock-alipay?orderNo=${params.orderNo}&amount=${(params.amount / 100).toFixed(2)}&subject=${encodeURIComponent(params.subject)}`,
    };
  }

  private async verifyMockCallback(params: Record<string, any>): Promise<CallbackVerification> {
    this.logger.log(`[Mock 支付宝] 回调: orderNo=${params.out_trade_no}`);
    return {
      success: true,
      orderNo: params.out_trade_no,
      paymentRef: `mock_alipay_${uuid().slice(0, 16)}`,
      amount: Math.round(parseFloat(params.total_amount || '0') * 100),
      rawData: params,
    };
  }
}
