export const getEmailTemplate = (subject: string, message: string) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
        
        body {
          font-family: 'Inter', Arial, sans-serif;
          background-color: #EFF4FF; 
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #F8F9FF; 
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(30, 64, 175, 0.1);
          border: 1px solid #DBEAFE;
        }
        .header {
          background-color: #1E40AF; 
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 28px;
          letter-spacing: 2px;
          font-weight: 700;
        }
        .header p {
          color: #DBEAFE; 
          margin: 5px 0 0 0;
          font-size: 14px;
          letter-spacing: 1px;
        }
        .content {
          padding: 40px 30px;
          color: #333333;
          line-height: 1.6;
        }
        .content h2 {
          color: #1E40AF; 
          margin-top: 0;
          font-size: 24px;
          font-weight: 700;
          border-bottom: 1px solid #94A3B8; 
          padding-bottom: 10px;
        }
        .content p {
          font-size: 16px;
          font-weight: 400;
        }
        .footer {
          background-color: #DBEAFE; 
          padding: 20px;
          text-align: center;
          color: #1E40AF;
          font-size: 12px;
          font-weight: 500;
          border-top: 1px solid #94A3B8; 
        }
        .footer strong {
          color: #1E40AF;
          font-weight: 700;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CORVUS</h1>
          <p>SISTEMA DE AUDITORÍA ACADÉMICA</p>
        </div>
        <div class="content">
          <h2>${subject}</h2>
          <p>${message}</p>
        </div>
        <div class="footer">
          <p>Este es un mensaje automático generado por <strong>Corvus</strong>.<br>Por favor, no respondas a este correo.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
