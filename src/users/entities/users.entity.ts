import { Column, Entity, OneToMany } from 'typeorm';
import { Roles } from '../const/roles.const';
import { PostsModel } from 'src/posts/entities/posts.entity';
import { BaseModel } from 'src/common/entity/base.entity';
import { IsEmail, IsString, Length } from 'class-validator';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation-message';
import { emailValidationMessage } from 'src/common/validation-message/email-validation.message';
import { Exclude, Expose } from 'class-transformer';

@Entity()
/**
 * 보안적으로 중요한 entity인 경우에는 Exclude() 데코레이터를 사용해서 전체 데이터를 노출시키지 않을 수 있다.
 * 필요한 경우에만 각 프로퍼티에 @Expose() 데코레이터를 사용해서 노출시킬 수 있다.
 */
export class UsersModel extends BaseModel {
  @Column({
    length: 20,
    unique: true, // database에 접근하기 전에 알 수 없기 때문에 validator 단계에서 알 수 없다.
  })
  @IsString({ message: stringValidationMessage })
  @Length(1, 20, {
    message: lengthValidationMessage,
  })
  // 1. 길이가 20을 넘지 않을 것
  // 2. 유일무이한 값이 될 것
  nickname: string;

  // @Expose()
  // get nicknameAndEmail() {
  //   return this.nickname + '/' + this.email;
  // }

  @Column({
    unique: true,
  })
  @IsString({ message: stringValidationMessage })
  @IsEmail({}, { message: emailValidationMessage })
  // 1. 유일무이한 값이 될 것
  email: string;

  @Column()
  @IsString({ message: stringValidationMessage })
  @Length(3, 8, {
    message: lengthValidationMessage,
  })
  /**
   * Request
   * frontend -> backend
   * plain object (JSON) -> class instance (dto)
   *
   * Response
   * backend -> frontend
   * class instance (dto) -> plain object (JSON)
   *
   * toClassOnly -> class instance (dto)로 변환될 때만
   * toPlainOnly -> plain object (JSON)로 변환될 때만
   */
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({
    type: 'enum',
    enum: Roles,
    default: Roles.USER,
  })
  role: Roles;

  @OneToMany(() => PostsModel, (post) => post.author)
  posts: PostsModel[];
}
