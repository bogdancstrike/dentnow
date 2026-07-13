import { render, screen } from '@testing-library/react';
import { App as AntApp, ConfigProvider } from 'antd';
import { describe, expect, it } from 'vitest';
import { AdminClient } from '../../src/admin/api/adminClient';
import { ImageUploadField } from '../../src/admin/components/ImageUploadField';

describe('ImageUploadField', () => {
  it('renders the doctor-specific generic placeholder when no portrait was uploaded', () => {
    const { container } = render(
      <ConfigProvider>
        <AntApp>
          <ImageUploadField
            client={new AdminClient(async () => 'token')}
            placeholderText="Echipa DentNow medic stomatolog"
          />
        </AntApp>
      </ConfigProvider>,
    );

    expect(screen.getByText('Echipa DentNow medic stomatolog')).toBeInTheDocument();
    expect(screen.queryByText(/Daria/i)).not.toBeInTheDocument();
    expect(container.querySelector('.image-upload-preview')).toBeInTheDocument();
    expect(container.querySelector('.image-upload-field')).toHaveStyle('--image-upload-width: 160px');
  });
});
