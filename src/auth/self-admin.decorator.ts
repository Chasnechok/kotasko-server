import { SetMetadata } from '@nestjs/common';
/**
 * 
 * @param idFieldName id field name from the request body 
 * @description Restricts given useCase to admins or to any user, whos id (from the token) matches the id of the entity he is trying to modify
 * @example User can change only his password, admins can change anyones password. 
 */
export const SelfOrAdmin = (idFieldName: string) => SetMetadata('selfOrAdmin', idFieldName);