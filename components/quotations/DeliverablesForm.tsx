'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Deliverables } from '@/types';
import { SESSION_TYPES } from '@/config/constants';

interface DeliverablesFormProps {
  deliverables: Deliverables | null;
  onChange: (deliverables: Deliverables) => void;
}

export function DeliverablesForm({ deliverables, onChange }: DeliverablesFormProps) {
  const [albumSize, setAlbumSize] = useState(deliverables?.albumSize || '16 × 24 (Book Type)');
  const [numberOfAlbums, setNumberOfAlbums] = useState(deliverables?.numberOfAlbums || 0);
  const [sheetsPerAlbum, setSheetsPerAlbum] = useState(deliverables?.sheetsPerAlbum || 0);
  const [totalSheets, setTotalSheets] = useState(deliverables?.totalSheets || 0);
  const [totalPhotosForSelection, setTotalPhotosForSelection] = useState(deliverables?.totalPhotosForSelection || 0);
  
  const [digital, setDigital] = useState(deliverables?.digital || {
    allImagesJPEG: false,
    traditionalVideoPendrive: false,
  });
  
  const [printGifts, setPrintGifts] = useState(deliverables?.printGifts || {
    miniBook: 0,
    calendar: 0,
    portraitFrames: 0,
  });
  
  const [others, setOthers] = useState(deliverables?.others || {
    cinematicTeaser: false,
    cinematicHighlight: false,
    aiFaceRecognitionImageDelivery: false,
    saveTheDateReels: false,
    premiumAlbumBox: false,
    extraFrame: false,
    otherWorks: false,
    otherWorksText: '',
  });

  const [services, setServices] = useState(deliverables?.services || {
    dronePhotography: false,
    droneVideography: false,
    preWeddingShoot: false,
    postWeddingShoot: false,
    outdoorShoot: false,
  });

  const [sessionType, setSessionType] = useState<string>('Full Session');

  // Calculate total sheets when numberOfAlbums or sheetsPerAlbum changes
  useEffect(() => {
    const calculated = numberOfAlbums * sheetsPerAlbum;
    setTotalSheets(calculated);
  }, [numberOfAlbums, sheetsPerAlbum]);

  useEffect(() => {
    const updated: Deliverables = {
      albumSize,
      numberOfAlbums,
      sheetsPerAlbum,
      totalSheets,
      totalPhotosForSelection,
      digital,
      printGifts,
      others,
      services,
      sessionType,
      // Keep old structure for backward compatibility
      albums: [{ type: 'Album', quantity: numberOfAlbums }],
      videos: {
        traditionalVideoEdited: 0,
        candidVideoTeaser: false,
        candidVideoHighlights: false,
        saveTheDateReel: false,
      },
      freeServices: {
        aiFaceRecognition: others.aiFaceRecognitionImageDelivery ?? false,
        instantQRCode: true,
      },
    };
    onChange(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumSize, numberOfAlbums, sheetsPerAlbum, totalSheets, totalPhotosForSelection, digital, printGifts, others, services, sessionType]);

  const albumSizeOptions = [
    { value: '10×30', label: '10×30 (Flat Type)' },
    { value: '12×30', label: '12×30 (Flat Type)' },
    { value: '12×36', label: '12×36 (Flat Type)' },
    { value: '15×24', label: '15×24 (Book Type)' },
    { value: '16×24', label: '16×24 (Book Type)' },
    { value: '18×24', label: '18×24 (Book Type)' },
    { value: 'Others', label: 'Others (Manual Entry)' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deliverables</CardTitle>
        <CardDescription>Plan Structure & Deliverables</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Albums Section */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold">Albums</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Number of Albums</Label>
              <Input
                type="number"
                value={numberOfAlbums}
                onChange={(e) => setNumberOfAlbums(parseInt(e.target.value) || 0)}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                placeholder="Quantity"
                min="0"
              />
            </div>
            <div>
              <Label>Sheets per Album</Label>
              <Input
                type="number"
                value={sheetsPerAlbum}
                onChange={(e) => setSheetsPerAlbum(parseInt(e.target.value) || 0)}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                placeholder="Sheets"
                min="0"
              />
            </div>
            <div>
              <Label>Total Sheets (Auto-calculated)</Label>
              <Input
                type="number"
                value={totalSheets}
                disabled
                className="bg-gray-100"
                placeholder="Auto-calculated"
              />
            </div>
            <div>
              <Label>Total No. of photos for selection</Label>
              <Input
                type="number"
                value={totalPhotosForSelection}
                onChange={(e) => setTotalPhotosForSelection(parseInt(e.target.value) || 0)}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                placeholder="Photos"
                min="0"
              />
            </div>
            <div>
              <Label>Album Size</Label>
              <Select value={albumSize} onValueChange={setAlbumSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {albumSizeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {albumSize === 'Others' && (
            <div>
              <Label>Custom Album Size</Label>
              <Input
                value={deliverables?.customAlbumSize || ''}
                onChange={(e) => {
                  const updated = { ...deliverables, customAlbumSize: e.target.value } as Deliverables;
                  onChange(updated);
                }}
                placeholder="Enter custom album size"
              />
            </div>
          )}
        </div>

        {/* Services (Checkbox List) */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold">Services</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={services.dronePhotography}
                onChange={(e) => setServices({ ...services, dronePhotography: e.target.checked })}
                className="rounded"
              />
              <Label>Drone Photography</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={services.droneVideography}
                onChange={(e) => setServices({ ...services, droneVideography: e.target.checked })}
                className="rounded"
              />
              <Label>Drone Videography</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={services.preWeddingShoot}
                onChange={(e) => setServices({ ...services, preWeddingShoot: e.target.checked })}
                className="rounded"
              />
              <Label>Pre-Wedding Shoot</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={services.postWeddingShoot}
                onChange={(e) => setServices({ ...services, postWeddingShoot: e.target.checked })}
                className="rounded"
              />
              <Label>Post-Wedding Shoot</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={services.outdoorShoot}
                onChange={(e) => setServices({ ...services, outdoorShoot: e.target.checked })}
                className="rounded"
              />
              <Label>Outdoor Shoot</Label>
            </div>
          </div>
          {(services.dronePhotography || services.droneVideography || services.preWeddingShoot || services.postWeddingShoot || services.outdoorShoot) && (
            <div className="mt-4">
              <Label>Session Type (Informational Only)</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((session) => (
                    <SelectItem key={session} value={session}>
                      {session}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Session type does not affect total price</p>
            </div>
          )}
        </div>

        {/* Other Deliverables (Checkbox List) */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold">Other Deliverables</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={digital.allImagesJPEG}
                onChange={(e) => setDigital({ ...digital, allImagesJPEG: e.target.checked })}
                className="rounded"
              />
              <Label>All Images in JPEG Format (Pendrive)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={digital.traditionalVideoPendrive}
                onChange={(e) => setDigital({ ...digital, traditionalVideoPendrive: e.target.checked })}
                className="rounded"
              />
              <Label>Traditional Video in Pendrive</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={others.cinematicTeaser}
                onChange={(e) => setOthers({ ...others, cinematicTeaser: e.target.checked })}
                className="rounded"
              />
              <Label>Cinematic Teaser</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={others.cinematicHighlight}
                onChange={(e) => setOthers({ ...others, cinematicHighlight: e.target.checked })}
                className="rounded"
              />
              <Label>Cinematic Highlight</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={others.aiFaceRecognitionImageDelivery}
                onChange={(e) => setOthers({ ...others, aiFaceRecognitionImageDelivery: e.target.checked })}
                className="rounded"
              />
              <Label>AI Face Recognition Image Delivery</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={others.saveTheDateReels}
                onChange={(e) => setOthers({ ...others, saveTheDateReels: e.target.checked })}
                className="rounded"
              />
              <Label>Save the Date Reels</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={others.premiumAlbumBox}
                onChange={(e) => setOthers({ ...others, premiumAlbumBox: e.target.checked })}
                className="rounded"
              />
              <Label>Premium Album Box</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={others.extraFrame}
                onChange={(e) => setOthers({ ...others, extraFrame: e.target.checked })}
                className="rounded"
              />
              <Label>Extra Frame</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={others.otherWorks}
                onChange={(e) => setOthers({ ...others, otherWorks: e.target.checked })}
                className="rounded"
              />
              <Label>Other Works</Label>
            </div>
            {others.otherWorks && (
              <div className="ml-6">
                <Input
                  value={others.otherWorksText || ''}
                  onChange={(e) => setOthers({ ...others, otherWorksText: e.target.value })}
                  placeholder="Specify other works..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Print & Gifts */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold">Print & Gifts</h3>
          <div>
            <Label>Mini Book</Label>
            <Input
              type="number"
              value={printGifts.miniBook}
              onChange={(e) => setPrintGifts({ ...printGifts, miniBook: parseInt(e.target.value) || 0 })}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              placeholder="Quantity"
              min="0"
            />
          </div>
          <div>
            <Label>Calendar</Label>
            <Input
              type="number"
              value={printGifts.calendar}
              onChange={(e) => setPrintGifts({ ...printGifts, calendar: parseInt(e.target.value) || 0 })}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              placeholder="Quantity"
              min="0"
            />
          </div>
          <div>
            <Label>Family & Couple Portrait Frames</Label>
            <Input
              type="number"
              value={printGifts.portraitFrames}
              onChange={(e) => setPrintGifts({ ...printGifts, portraitFrames: parseInt(e.target.value) || 0 })}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              placeholder="Quantity"
              min="0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
