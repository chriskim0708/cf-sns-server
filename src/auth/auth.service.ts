import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersModel } from 'src/users/entities/users.entity';
import { HASH_ROUNDS, JWT_SECRET } from './const/auth.const';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * 토큰을 사용하게 되는 방식
   *
   * 1) 사용자가 로그인 또는 회원가입을 진행하면
   *  - accessToken과 refreshToken을 발급한다.
   * 2) 로그인 할 때는 Basic 토큰과 함께 요청을 보낸다. (Authorization: Basic base64(email:password))
   * 3) 아무나 접근할 수 없는 정보 (private route)를 접근할 때는 accessToken을 Header에 추가해서 함께 요청한다. (Authorization: Bearer accessToken)
   * 4) 토큰과 요청을 함께 받은 서버는 토큰 검증을 통해 현재 요청을 보낸 사용자가 누구인지 알 수 있다.
   *  - 예를 들어서 현재 로그인한 사용자가 작성한 포스트만 가져오려면 토큰의 sub 값에 입력되어 있는 사용자의 포스트만 따로 필터링 할 수 있다.
   *  - 특정 사용자의 토큰이 없다면 다른 사용자의 데이터를 접근 못한다.
   * 5) 모든 토큰은 만료 기간이 있다. 만료 기간이 지나면 새로 토큰을 발급 받아야한다.
   *  - 그렇지 않으면 jwtService.verify()에서 인증이 통과 안된다.
   *  - 그러니 accessToken을 새로 발급 받을 수 있는 /auth/token/access와
   *  - refreshToken을 새로 발급 받을 수 있는 /auth/token/refresh를 만들어야 한다.
   * 6) 토큰이 만료되면 각각의 토큰을 새로 발급 받을 수 있는 엔드포인트에 요청해서 새로운 토큰을 발급 받고 새로운 토큰을 사용해서 private route에 접근한다.
   */

  /**
   * Header로 부터 토큰을 받을 때
   *
   * { authorization: 'Basic {token}'}
   * { authorization: 'Bearer {token}'}
   */

  extractTokenFromHeader(header: string, isBearer: boolean) {
    const splitToken = header.split(' ');

    const prefix = isBearer ? 'Bearer' : 'Basic';

    if (splitToken.length !== 2 || splitToken[0] !== prefix) {
      throw new UnauthorizedException('올바르지 않은 토큰입니다.');
    }

    const token = splitToken[1];

    return token;
  }

  /**
   * 1) asdfasfsdaf12lkj312klj -> email:password
   * 2) email:password -> [email, password]
   * 3) { email, password }
   */
  decodeBasicToken(base64String: string) {
    const decoded = Buffer.from(base64String, 'base64').toString('utf8');

    const split = decoded.split(':');

    if (split.length !== 2) {
      throw new UnauthorizedException('올바르지 않은 토큰입니다.');
    }

    const email = split[0];
    const password = split[1];

    return { email, password };
  }

  /**
   * 토큰 검증
   */
  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: JWT_SECRET,
      });
    } catch (e) {
      throw new UnauthorizedException('토큰이 만료되었거나 올바르지 않습니다.');
    }
  }

  rotateToken(token: string, isRefreshToken: boolean) {
    const decoded = this.verifyToken(token);

    /**
     * sub: id,
     * email: email,
     * type: 'access' | 'refresh'
     */
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException(
        '토큰 재발급은 Refresh Token으로만 가능합니다.',
      );
    }

    return this.signToken({ ...decoded }, isRefreshToken);
  }

  /**
   * 우리가 만드려는 기능
   *
   * 1) registerWithEmail
   *    - email, nickname, password를 입력 받고 사용자를 생성한다.
   *    - 생성이 완료되면 accessToken과 refreshToken을 발급한다.
   *    - 회원가입 후 바로 로그인을 할 수 있도록 (프론트엔드에서)
   *
   * 2) loginWithEmail
   *    - email, password를 입력 받고 사용자 검증을 진행한다.
   *    - 검증이 완료되면 accessToken과 refreshToken을 발급한다.
   *
   * 3) loginUser
   *    - 1), 2)에서 필요한 accessToken과 refreshToken을 발급하는 로직
   *
   * 4) signToken
   *    - 3)에서 필요한 accessToken과 refreshToken을 sign하는 로직
   *
   * 5) authenticateWithEmailAndPassword
   *    - 2)에서 로그인을 진행할 때 필요한 기본적인 검증 진행
   *    - 사용자가 존재하는지 확인 (이메일)
   *    - 비밀번호가 일치하는지 확인
   *    - 모두 통과되면 찾은 사용자 정보 반환
   *    - loginWithEmail에서 반환된 데이터를 기반으로 토큰 생성
   */

  /**
   * payload에 들어갈 정보
   *
   * 1) email
   * 2) sub === id
   * 3) type: 'access' | 'refresh'
   *
   * { email: string, id: number }
   */
  signToken(user: Pick<UsersModel, 'email' | 'id'>, isRefreshToken: boolean) {
    const payload = {
      email: user.email,
      sub: user.id,
      type: isRefreshToken ? 'refresh' : 'access',
    };

    return this.jwtService.sign(payload, {
      secret: JWT_SECRET,
      // seconds
      expiresIn: isRefreshToken ? 3600 : 300,
    });
  }

  loginUser(user: Pick<UsersModel, 'email' | 'id'>) {
    const accessToken = this.signToken(user, false);
    const refreshToken = this.signToken(user, true);

    return {
      accessToken,
      refreshToken,
    };
  }

  async authenticateWithEmailAndPassword(email: string, password: string) {
    // 1. email을 통해 사용자를 찾는다.
    // 2. 사용자가 존재하지 않는다면 에러를 발생시킨다.
    // 3. 사용자가 존재한다면 비밀번호가 일치하는지 확인한다.
    // 4. 비밀번호가 일치하지 않는다면 에러를 발생시킨다.
    // 5. 모두 통과했다면 사용자 정보를 반환한다.
    const existingUser = await this.usersService.getUserByEmail(email);

    if (!existingUser) {
      throw new UnauthorizedException('존재하지 않는 사용자입니다.');
    }

    // compare(입력된 비밀번호, 기존 해시된 비밀번호)
    const passOk = await bcrypt.compare(password, existingUser.password);

    if (!passOk) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
    }

    return existingUser;
  }

  async loginWithEmail(email: string, password: string) {
    const existingUser = await this.authenticateWithEmailAndPassword(
      email,
      password,
    );

    return this.loginUser(existingUser);
  }

  async registerWithEmail(user: RegisterUserDto) {
    // hash(비밀번호, 10)
    // hash round: 해쉬를 돌리는데 걸리는 시간에 관련됨
    const hash = await bcrypt.hash(user.password, HASH_ROUNDS);

    const newUser = await this.usersService.createUser(
      user.nickname,
      user.email,
      hash,
    );

    return this.loginUser(newUser);
  }
}
