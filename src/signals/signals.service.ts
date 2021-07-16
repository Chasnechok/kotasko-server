import { Injectable } from '@nestjs/common';
import { CreateSignalDto } from './dto/create-signal.dto';
import { UpdateSignalDto } from './dto/update-signal.dto';

@Injectable()
export class SignalsService {
  create(createSignalDto: CreateSignalDto) {
    return 'This action adds a new signal';
  }

  findAll() {
    return `This action returns all signals`;
  }

  findOne(id: number) {
    return `This action returns a #${id} signal`;
  }

  update(id: number, updateSignalDto: UpdateSignalDto) {
    return `This action updates a #${id} signal`;
  }

  remove(id: number) {
    return `This action removes a #${id} signal`;
  }
}
