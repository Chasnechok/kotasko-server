import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Organisation, OrganisationSchema } from './organisation.schema'
import { OrganisationsController } from './organisations.controller'
import { OrganisationsService } from './organisations.service'

@Module({
    imports: [MongooseModule.forFeature([{ name: Organisation.name, schema: OrganisationSchema }])],
    controllers: [OrganisationsController],
    providers: [OrganisationsService],
    exports: [MongooseModule],
})
export class OrganisationsModule {}
