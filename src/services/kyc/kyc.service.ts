import { Injectable } from '@nestjs/common';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class KycService {
  constructor(private readonly prisma: PrismaService) {}
  create(createKycDto: CreateKycDto) {
    return 'This action adds a new kyc';
    // this.prisma.kYCVerification.create({ data: createKycDto });
  }

  findAll() {
    return `This action returns all kyc`;
  }

  findOne(id: number) {
    return `This action returns a #${id} kyc`;
  }

  update(id: number, updateKycDto: UpdateKycDto) {
    return `This action updates a #${id} kyc`;
  }

  remove(id: number) {
    return `This action removes a #${id} kyc`;
  }
}
