"use client"

import Image from 'next/image';

export default function ImagesPage() {
  const images = [
    {
      name: 'alarm.svg',
      path: '/api/static/alarm.svg',
      description: '알람/이벤트 아이콘'
    },
    {
      name: 'king.svg',
      path: '/api/static/king.svg',
      description: '왕관/1위 아이콘'
    }
  ];

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Static Images</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div key={image.name} className="border rounded-lg p-4 shadow-sm">
            <div className="mb-4 flex justify-center">
              <img 
                src={image.path} 
                alt={image.name}
                className="w-16 h-16 object-contain"
              />
            </div>
            <h3 className="font-semibold text-lg mb-2">{image.name}</h3>
            <p className="text-gray-600 text-sm mb-3">{image.description}</p>
            <div className="space-y-2">
              <div className="text-xs bg-gray-100 p-2 rounded font-mono break-all">
                {`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : ''}${image.path}`}
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}${image.path}`)}
                className="w-full px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Copy URL
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h2 className="font-semibold mb-2">사용법</h2>
        <p className="text-sm text-gray-700">
          이미지들은 <code>/api/static/[파일명]</code> 경로로 접근할 수 있습니다. 
          Discord 봇에서 썸네일로 사용할 때는 전체 URL을 사용하세요.
        </p>
      </div>
    </div>
  );
}