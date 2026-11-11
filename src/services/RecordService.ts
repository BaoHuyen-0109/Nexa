import { GenericRecord } from '../models/BaseModel';
import { InMemoryMockRepository } from '../repositories/InMemoryMockRepository';
import { BaseCrudService } from './BaseCrudService';

/**
 * DỮ LIỆU GIẢ LẬP TRUNG TÍNH (MOCK ARCHITECTURE CHECK DATA)
 *
 * LƯU Ý QUAN TRỌNG:
 * - Đây KHÔNG phải là dữ liệu nghiệp vụ hay bảng Database chính thức.
 * - Chỉ gồm 2 bản ghi khung trung tính để xác nhận luồng Read / Create / Update / Delete
 *   hoạt động trơn tru trên ứng dụng trước khi nhận đề thi.
 */
const INITIAL_PLACEHOLDER_RECORDS: GenericRecord[] = [
  {
    id: 'MOCK_01',
    title: 'Bản ghi kiểm tra kiến trúc #01',
    subtitle: 'Dữ liệu khung trung tính (Mock Repository)',
    description:
      'Bản ghi mẫu không gắn nghiệp vụ, dùng để kiểm tra hiển thị danh sách, chi tiết, chỉnh sửa và xóa.',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'MOCK_02',
    title: 'Bản ghi kiểm tra kiến trúc #02',
    subtitle: 'Sẵn sàng thay thế bằng Database đề thi',
    description:
      'Khi giảng viên công bố cấu trúc bảng, chỉ cần thay thế Repository tại tầng Service.',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockRepository = new InMemoryMockRepository<GenericRecord>(
  INITIAL_PLACEHOLDER_RECORDS,
  ['title', 'subtitle', 'description']
);

/**
 * Service mặc định phục vụ kiểm tra luồng CRUD trên các màn hình khung.
 */
export const recordService = new BaseCrudService<GenericRecord>(mockRepository);

