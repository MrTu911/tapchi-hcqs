'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Calendar, GitCompare, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Version {
  id: string;
  versionNo: number;
  filesetId: string;
  changelog: string | null;
  createdAt: string;
  submission: {
    title: string;
    abstractVn: string | null;
    abstractEn: string | null;
    keywords: string[];
  };
}

interface FileInfo {
  id: string;
  fileName: string;
  fileType: string;
  cloud_storage_path: string;
  createdAt: string;
}

interface VersionComparisonProps {
  versions: Version[];
  files: FileInfo[];
  currentVersion: {
    title: string;
    abstractVn: string | null;
    abstractEn: string | null;
    keywords: string[];
    updatedAt: string;
  };
}

export default function VersionComparison({
  versions,
  files,
  currentVersion
}: VersionComparisonProps) {
  const [selectedVersion1, setSelectedVersion1] = useState<string>('current');
  const [selectedVersion2, setSelectedVersion2] = useState<string>(versions[0]?.id || '');

  const getVersionData = (versionId: string) => {
    if (versionId === 'current') {
      return {
        title: currentVersion.title,
        abstractVn: currentVersion.abstractVn,
        abstractEn: currentVersion.abstractEn,
        keywords: currentVersion.keywords,
        versionNo: 'Hiện tại',
        date: currentVersion.updatedAt
      };
    }

    const version = versions.find((v) => v.id === versionId);
    if (!version) return null;

    return {
      title: version.submission.title,
      abstractVn: version.submission.abstractVn,
      abstractEn: version.submission.abstractEn,
      keywords: version.submission.keywords,
      versionNo: `V${version.versionNo}`,
      date: version.createdAt,
      changelog: version.changelog
    };
  };

  const version1Data = getVersionData(selectedVersion1);
  const version2Data = getVersionData(selectedVersion2);

  const compareText = (text1: string | null, text2: string | null): 'same' | 'different' => {
    if (text1 === text2) return 'same';
    return 'different';
  };

  const compareArrays = (arr1: string[], arr2: string[]): 'same' | 'different' => {
    if (arr1.length !== arr2.length) return 'different';
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    return sorted1.every((val, idx) => val === sorted2[idx]) ? 'same' : 'different';
  };

  if (versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử phiên bản</CardTitle>
          <CardDescription>Chưa có phiên bản nào được tạo</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Version History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử phiên bản</CardTitle>
          <CardDescription>
            Tất cả {versions.length + 1} phiên bản của bài viết
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Version */}
            <div className="flex items-start gap-4 p-4 bg-primary/5 border-l-4 border-l-primary rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge>Hiện tại</Badge>
                  <span className="text-sm text-muted-foreground">
                    Cập nhật: {format(new Date(currentVersion.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </span>
                </div>
                <h4 className="font-semibold mb-1">{currentVersion.title}</h4>
                <div className="flex flex-wrap gap-1 mt-2">
                  {currentVersion.keywords.map((keyword, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Previous Versions */}
            {versions.map((version) => (
              <div key={version.id} className="flex items-start gap-4 p-4 border-l-4 border-l-muted rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">V{version.versionNo}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(version.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </span>
                  </div>
                  {version.changelog && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Thay đổi:</strong> {version.changelog}
                    </p>
                  )}
                  <h4 className="font-semibold mb-1">{version.submission.title}</h4>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {version.submission.keywords.map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Version Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            So sánh phiên bản
          </CardTitle>
          <CardDescription>
            Chọn hai phiên bản để so sánh sự thay đổi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Version Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Phiên bản 1</label>
              <Select value={selectedVersion1} onValueChange={setSelectedVersion1}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Hiện tại</SelectItem>
                  {versions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      V{v.versionNo} - {format(new Date(v.createdAt), 'dd/MM/yyyy')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Phiên bản 2</label>
              <Select value={selectedVersion2} onValueChange={setSelectedVersion2}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Hiện tại</SelectItem>
                  {versions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      V{v.versionNo} - {format(new Date(v.createdAt), 'dd/MM/yyyy')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {version1Data && version2Data && (
            <>
              <Separator />

              {/* Comparison Results */}
              <div className="space-y-4">
                {/* Title Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      Tiêu đề ({version1Data.versionNo})
                      {compareText(version1Data.title, version2Data.title) === 'different' && (
                        <Badge variant="destructive" className="text-xs">Khác</Badge>
                      )}
                    </h4>
                    <p className="text-sm">{version1Data.title}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      Tiêu đề ({version2Data.versionNo})
                      {compareText(version1Data.title, version2Data.title) === 'different' && (
                        <Badge variant="destructive" className="text-xs">Khác</Badge>
                      )}
                    </h4>
                    <p className="text-sm">{version2Data.title}</p>
                  </div>
                </div>

                <Separator />

                {/* Abstract VN Comparison */}
                {(version1Data.abstractVn || version2Data.abstractVn) && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          Tóm tắt (Tiếng Việt)
                          {compareText(version1Data.abstractVn, version2Data.abstractVn) === 'different' && (
                            <Badge variant="destructive" className="text-xs">Khác</Badge>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-4">
                          {version1Data.abstractVn || 'Không có'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          Tóm tắt (Tiếng Việt)
                          {compareText(version1Data.abstractVn, version2Data.abstractVn) === 'different' && (
                            <Badge variant="destructive" className="text-xs">Khác</Badge>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-4">
                          {version2Data.abstractVn || 'Không có'}
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Abstract EN Comparison */}
                {(version1Data.abstractEn || version2Data.abstractEn) && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          Abstract (English)
                          {compareText(version1Data.abstractEn, version2Data.abstractEn) === 'different' && (
                            <Badge variant="destructive" className="text-xs">Khác</Badge>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-4">
                          {version1Data.abstractEn || 'None'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          Abstract (English)
                          {compareText(version1Data.abstractEn, version2Data.abstractEn) === 'different' && (
                            <Badge variant="destructive" className="text-xs">Khác</Badge>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-4">
                          {version2Data.abstractEn || 'None'}
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Keywords Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      Từ khóa
                      {compareArrays(version1Data.keywords, version2Data.keywords) === 'different' && (
                        <Badge variant="destructive" className="text-xs">Khác</Badge>
                      )}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {version1Data.keywords.map((keyword, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      Từ khóa
                      {compareArrays(version1Data.keywords, version2Data.keywords) === 'different' && (
                        <Badge variant="destructive" className="text-xs">Khác</Badge>
                      )}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {version2Data.keywords.map((keyword, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Changelog */}
                {(version1Data as any).changelog && (
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Ghi chú thay đổi (V{(version1Data as any).versionNo})</h4>
                    <p className="text-sm text-muted-foreground">{(version1Data as any).changelog}</p>
                  </div>
                )}
                {(version2Data as any).changelog && selectedVersion1 !== selectedVersion2 && (
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Ghi chú thay đổi (V{(version2Data as any).versionNo})</h4>
                    <p className="text-sm text-muted-foreground">{(version2Data as any).changelog}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* File History */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử file bản thảo</CardTitle>
            <CardDescription>
              Tất cả {files.length} file đã upload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file, idx) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        Upload: {format(new Date(file.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </p>
                    </div>
                    {idx === 0 && <Badge className="ml-2">Mới nhất</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
