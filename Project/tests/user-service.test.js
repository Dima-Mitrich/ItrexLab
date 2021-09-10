import bcrypt from 'bcryptjs';
import SequelizeMock from 'sequelize-mock';
import jwt from 'jsonwebtoken';
import UserService from '../api/auth/service/user-service.js';
import UserSqlRepository from '../api/auth/repository/user-sql-repository.js';
import PatientSqlRepository from '../api/patient/repository/patient-sql-repository.js';
import decodeToken from '../helpers/decode-token.js';

const patientsSQLDBMock = new SequelizeMock();
const usersSQLDBMock = new SequelizeMock();

const patientSqlRepository = new PatientSqlRepository(patientsSQLDBMock);
const userSqlRepository = new UserSqlRepository(usersSQLDBMock);
const userService = new UserService(userSqlRepository, patientSqlRepository);

jest.mock('../api/auth/repository/user-sql-repository.js');
jest.mock('../api/patient/repository/patient-sql-repository.js');
jest.mock('../helpers/decode-token.js');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('user service unit test', () => {
  const testTime = new Date().getTime();
  const regData = {
    email: 'andryigr@gmail.com',
    password: '1111',
    name: 'Andrei',
    birthday: 730080000000,
    gender: 'male',
  };
  const userData = {
    id: '333',
    email: 'aaa@list',
    password: '000',
    createdAt: testTime,
    updatedAt: testTime,
  };
  const patientData = {
    id: '111',
    name: 'Andrei',
    birthday: 730080000000,
    gender: 'male',
    userId: '333',
    createdAt: testTime,
    updatedAt: testTime,
  };

  userService.getToken = jest.fn(() => 'valid_token_111');

  test('registration test', async () => {
    userSqlRepository.checkEmail.mockResolvedValue(false);
    bcrypt.genSaltSync.mockResolvedValue(10);
    bcrypt.hashSync.mockResolvedValue(1111);
    userSqlRepository.add.mockResolvedValue(userData);
    patientSqlRepository.add.mockResolvedValue(patientData);
    const res = await userService.registration(regData);
    expect(res).toEqual('valid_token_111');
  });

  test('registration test(email in base)', async () => {
    userSqlRepository.checkEmail.mockResolvedValue(true);
    const res = await userService.registration(regData);
    expect(res).toEqual(false);
  });

  test('login', async () => {
    userSqlRepository.checkEmail.mockResolvedValue(userData);
    bcrypt.compareSync.mockResolvedValue(true);
    const res = await userService.login(regData);
    expect(res).toEqual({email: true, password: true, token: "valid_token_111"});
  });

  test('login, email doesn\'t match', async () => {
    userSqlRepository.checkEmail.mockResolvedValue(false);
    bcrypt.compareSync = jest.fn(() => true);
    jwt.sign.mockResolvedValue('111');
    const res = await userService.login(regData);
    expect(res).toEqual({email: false, password: false, token: undefined});
  });

  test('login, password doesn\'t match', async () => {
    userSqlRepository.checkEmail.mockResolvedValue(userData);
    bcrypt.compareSync = jest.fn(() => false);
    const res = await userService.login(regData);
    expect(res).toEqual({email: true, password: false, token: undefined});
  });

  test('get by token ', async () => {
    decodeToken.mockResolvedValue(userData);
    patientSqlRepository.getByUserId.mockResolvedValue(patientData);
    const res = await userService.getPatientByToken('111fff');
    expect(res).toEqual(patientData);
  });

  test('get by token, id doesn\'t match', async () => {
    decodeToken.mockResolvedValue(userData);
    patientSqlRepository.getByUserId.mockResolvedValue(false);
    const res = await userService.getPatientByToken('111fff');
    expect(res).toEqual(false);
  });

  test('get by userId ', async () => {
    patientSqlRepository.getByUserId.mockResolvedValue(patientData);
    const res = await userService.getByUserId('111');
    expect(res).toEqual(patientData);
  });

  test('get by userId, doesn\'t match ', async () => {
    patientSqlRepository.getByUserId.mockResolvedValue(false);
    const res = await userService.getByUserId('111');
    expect(res).toEqual(false);
  });
});
