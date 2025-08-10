import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { QueryEpicDto } from './query-epic.dto';

describe('QueryEpicDto', () => {
  describe('validation', () => {
    it('should pass validation with valid date', async () => {
      const dto = plainToClass(QueryEpicDto, {
        date: '2019-05-30',
        natural: true,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid date only', async () => {
      const dto = plainToClass(QueryEpicDto, {
        date: '2019-05-30',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty object', async () => {
      const dto = plainToClass(QueryEpicDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid date format', async () => {
      const dto = plainToClass(QueryEpicDto, {
        date: '2019/05/30',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isDateString).toBeDefined();
    });

    it('should fail validation with invalid date', async () => {
      const dto = plainToClass(QueryEpicDto, {
        date: 'invalid-date',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isDateString).toBeDefined();
    });

    it('should pass validation with natural as string true', async () => {
      const dto = plainToClass(QueryEpicDto, {
        natural: 'true',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.natural).toBe(true);
    });

    it('should pass validation with natural as string false', async () => {
      const dto = plainToClass(QueryEpicDto, {
        natural: 'false',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.natural).toBe(false);
    });

    it('should pass validation with natural as boolean true', async () => {
      const dto = plainToClass(QueryEpicDto, {
        natural: true,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.natural).toBe(true);
    });

    it('should pass validation with natural as boolean false', async () => {
      const dto = plainToClass(QueryEpicDto, {
        natural: false,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.natural).toBe(false);
    });
  });

  describe('transformation', () => {
    it('should transform string natural to boolean', () => {
      const dto = plainToClass(QueryEpicDto, {
        natural: 'true',
      });

      expect(dto.natural).toBe(true);
    });

    it('should transform string false to boolean', () => {
      const dto = plainToClass(QueryEpicDto, {
        natural: 'false',
      });

      expect(dto.natural).toBe(false);
    });

    it('should keep boolean natural as is', () => {
      const dto = plainToClass(QueryEpicDto, {
        natural: true,
      });

      expect(dto.natural).toBe(true);
    });

    it('should keep date string as is', () => {
      const dateString = '2019-05-30';
      const dto = plainToClass(QueryEpicDto, {
        date: dateString,
      });

      expect(dto.date).toBe(dateString);
    });
  });

  describe('default values', () => {
    it('should have natural default to true when not provided', () => {
      const dto = plainToClass(QueryEpicDto, {});

      expect(dto.natural).toBe(true);
    });

    it('should have date as undefined when not provided', () => {
      const dto = plainToClass(QueryEpicDto, {});

      expect(dto.date).toBeUndefined();
    });
  });
});
