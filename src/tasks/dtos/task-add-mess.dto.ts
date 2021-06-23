import { IsMongoId, IsObject, ValidateNested } from "class-validator";
import { IMessage } from "../task.schema";


export class TaskAddMessage {
    
    @IsMongoId()
    readonly taskId: string;

    @IsObject()
    @ValidateNested()
    message: IMessage;
}