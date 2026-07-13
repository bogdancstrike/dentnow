/**
 * Reusable image field for admin forms. Uploads to /v1/admin/media/upload and stores
 * the returned media asset id. Renders a thumbnail via the public media proxy (admin
 * edits are live immediately, so the same proxy serves it). Designed to sit inside an
 * AntD <Form.Item> — it reads `value` (media id) and calls `onChange(id | null)`.
 */
import { useRef, useState, type CSSProperties } from 'react';
import { App, Button, Spin, Typography } from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import type { AdminClient } from '../api/adminClient';
import { mediaUrl } from '../../api/publicClient';
import './imageUploadField.css';

export interface ImageUploadFieldProps {
  id?: string;
  client: AdminClient;
  value?: string | null; // media asset id
  onChange?: (id: string | null) => void;
  /** Alt text is required for public images; defaults to a generic label. */
  altText?: string;
  variant?: 'card' | 'thumbnail' | 'hero';
  width?: number;
  height?: number;
  placeholderText?: string;
}

export function ImageUploadField({
  id,
  client,
  value,
  onChange,
  altText = 'Imagine DentNow',
  variant = 'card',
  width = 160,
  height = 160,
  placeholderText = 'Fără imagine',
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
    <div
      className="image-upload-field"
      style={{
        '--image-upload-width': `${width}px`,
        '--image-upload-ratio': `${width} / ${height}`,
      } as CSSProperties}
    >
      <div className="image-upload-layout">
        <div className="image-upload-preview">
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
              {placeholderText}
            </Typography.Text>
          )}
        </div>
        <div className="image-upload-actions">
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
        </div>
      </div>
      <input
        id={id}
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
