import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOrganisationDto, GetHeadDto } from './dtos/organisation.dto';
import { Organisation } from './organisation.schema';

@Injectable()
export class OrganisationsService {
    constructor(@InjectModel(Organisation.name) private organisationModel: Model<Organisation>) {}

    async create(CreateOrganisationDto: CreateOrganisationDto): Promise<Organisation> {
      const createdOrganisation = new this.organisationModel(CreateOrganisationDto);
      return createdOrganisation.save();
    }

    async findAll(): Promise<Organisation[]> {
      return this.organisationModel.find().exec();
    }

    async getHead(getHeadDto: GetHeadDto): Promise<Organisation> {
      const org = await this.organisationModel.findOne({_id: getHeadDto.orgId}, { __v: 0 }).populate({
        path: 'head',
        select: 'details'
      });
      if(!org) throw new NotFoundException(`Organisation with ${getHeadDto.orgId} id not found!`);
      return org;
    }
}
