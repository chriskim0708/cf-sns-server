import { ValidationArguments } from 'class-validator';

export const lengthValidationMessage = (args: ValidationArguments) => {
  /**
   * ValidationArguments
   * 1) value: 검증 되고 있는 값 (입력된 값)
   * 2) constraints: 파라메터에 입력된 제한 사항들
   *   - args.constraints[0]: 1
   *   - args.constraints[1]: 20
   * 3) targetName: 검증되고 있는 객체의 이름
   * 4) object: 검증되고 있는 객체
   * 5) property: 검증되고 있는 객체의 속성
   */

  if (args.constraints.length === 2) {
    return `${args.property}은 ${args.constraints[0]}글자 이상, ${args.constraints[1]}글자 이하여야 합니다.`;
  } else {
    return `${args.property}은 최소 ${args.constraints[0]}글자를 입력해주세요.`;
  }
};
