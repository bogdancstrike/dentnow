/**
 * Reusable image field for admin forms. Uploads to /v1/admin/media/upload and stores
 * the returned media asset id. Renders a thumbnail via the public media proxy (admin
 * edits are live immediately, so the same proxy serves it). Designed to sit inside an
 * AntD <Form.Item> — it reads `value` (media id) and calls `onChange(id | null)`.
 */
import { useRef, useState } from 'react';
import { App, Button, Space, Spin, Typography } from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import type { AdminClient } from '../api/adminClient';
import { mediaUrl } from '../../api/publicClient';

export interface ImageUploadFieldProps {
  client: AdminClient;
  value?: string | null; // media asset id
  onChange?: (id: string | null) => void;
  /** Alt text is required for public images; defaults to a generic label. */
  altText?: string;
  variant?: 'card' | 'thumbnail' | 'hero';
  width?: number;
  height?: number;
}

export function ImageUploadField({
  client,
  value,
  onChange,
  altText = 'Imagine DentNow',
  variant = 'card',
  width = 160,
  height = 160,
}: ImageUploadFieldProps) {
  const { message } = App.useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('alt_text', altText.trim() || 'Imagine DentNow');
      fd.append('privacy_class', 'public');
      const { data } = await client.upload<{ id: string }>('/v1/admin/media/upload', fd);
      onChange?.(data.id);
      message.success('Imagine încărcată');
    } catch (error) {
      message.error((error as Error).message || 'Încărcarea imaginii a eșuat');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="image-upload-field">
      <Space align="start" size="middle">
        <div
          style={{
            width,
            height,
            borderRadius: 10,
            border: '1px dashed #cbd5e1',
            background: '#f8fafc',
            display: 'grid',
            placeItems: 'center',
            overflow: 'hidden',
            flex: '0 0 auto',
          }}
        >
          {uploading ? (
            <Spin />
          ) : value ? (
            <img
              src={mediaUrl(value, variant)}
              alt={altText}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Fără imagine
            </Typography.Text>
          )}
        </div>
        <Space direction="vertical" size="small">
          <Button icon={<UploadOutlined />} onClick={pickFile} loading={uploading}>
            {value ? 'Schimbă imaginea' : 'Încarcă imagine'}
          </Button>
          {value && (
            <Button danger icon={<DeleteOutlined />} onClick={() => onChange?.(null)} disabled={uploading}>
              Elimină
            </Button>
          )}
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            JPG / PNG / WebP. Fără SVG.
          </Typography.Text>
        </Space>
      </Space>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
