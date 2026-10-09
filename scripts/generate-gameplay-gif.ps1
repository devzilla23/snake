$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$source = @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Text;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;

public static class SnakeGameplayGif
{
    private const int Width = 336;
    private const int Height = 336;
    private const int Speed = 2;
    private const int GrowRate = 10;
    private const int FrameDelay = 4;

    private static readonly Color[] Palette = {
        Color.FromArgb(244, 164, 96), Color.FromArgb(0, 128, 0),
        Color.FromArgb(0, 0, 0), Color.FromArgb(255, 35, 72),
        Color.FromArgb(49, 181, 90), Color.FromArgb(190, 36, 52),
        Color.FromArgb(255, 194, 131), Color.FromArgb(0, 82, 0),
        Color.FromArgb(255, 255, 255), Color.FromArgb(130, 130, 130),
        Color.FromArgb(90, 90, 90), Color.FromArgb(210, 210, 210),
        Color.FromArgb(255, 95, 115), Color.FromArgb(110, 170, 80),
        Color.FromArgb(220, 135, 65), Color.FromArgb(20, 20, 20)
    };

    public static void Build(string outputPath, string applePath)
    {
        List<byte[]> frames = new List<byte[]>();
        List<PointF> trail = new List<PointF>();
        float x = 150;
        float y = 150;
        float appleX = 100;
        float appleY = 100;
        int direction = 0;
        int score = 0;

        for (int index = 0; index <= 12; index++)
            trail.Add(new PointF(180 - index * Speed, 156));
        trail.Add(new PointF(x + 7.5f, y + 6));

        using (Bitmap apple = new Bitmap(applePath))
        {
            frames.Add(Render(x, y, appleX, appleY, direction, score, trail, apple));

            for (int tick = 0; tick < 240; tick++)
            {
                float midX;
                float midY;
                switch (direction)
                {
                    case 0: midX = x - 3; midY = y + 3; break;
                    case 1: midX = x + 7.5f; midY = y - 3; break;
                    case 2: midX = x + 15; midY = y + 7.5f; break;
                    default: midX = x + 7.5f; midY = y + 15; break;
                }

                if (midX >= appleX && midX <= appleX + 16 &&
                    midY >= appleY && midY <= appleY + 16)
                {
                    score++;
                    if (score == 1) { appleX = 220; appleY = 100; }
                    else if (score == 2) { appleX = 220; appleY = 220; }
                    else { appleX = 270; appleY = 80; }
                }

                if (direction == 0) x -= Speed;
                else if (direction == 1) y -= Speed;
                else if (direction == 2) x += Speed;
                else y += Speed;

                trail.Add(new PointF(x + 7.5f, y + 6));

                if (direction == 0 && x <= 104) direction = 1;
                else if (direction == 1 && y <= 104) direction = 2;
                else if (direction == 2 && x >= 220) direction = 3;
                else if (direction == 3 && y >= 220) direction = 0;

                if (tick % 2 == 1)
                    frames.Add(Render(x, y, appleX, appleY, direction, score, trail, apple));

                if (score >= 3 && direction == 0 && x <= 180)
                    break;
            }
        }

        Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
        WriteGif(outputPath, frames);
    }

    private static byte[] Render(float x, float y, float appleX, float appleY,
        int direction, int score, List<PointF> trail, Bitmap apple)
    {
        using (Bitmap bitmap = new Bitmap(Width, Height, PixelFormat.Format24bppRgb))
        using (Graphics graphics = Graphics.FromImage(bitmap))
        using (Font font = new Font("Segoe UI", 16, FontStyle.Regular, GraphicsUnit.Pixel))
        using (Brush black = new SolidBrush(Color.Black))
        using (Pen snakePen = new Pen(Color.FromArgb(0, 128, 0), 15))
        using (Brush snakeBrush = new SolidBrush(Color.FromArgb(0, 128, 0)))
        {
            graphics.SmoothingMode = SmoothingMode.AntiAlias;
            graphics.TextRenderingHint = TextRenderingHint.AntiAliasGridFit;
            graphics.Clear(Color.FromArgb(244, 164, 96));
            graphics.DrawString("score: " + score, font, black, 30, 25);
            graphics.DrawImage(apple, new Rectangle((int)appleX, (int)appleY, 16, 16));

            snakePen.StartCap = LineCap.Round;
            snakePen.EndCap = LineCap.Round;
            snakePen.LineJoin = LineJoin.Round;
            List<PointF> body = GetBodyPath(trail, 24 + score * GrowRate * Speed);
            if (body.Count > 1)
                graphics.DrawLines(snakePen, body.ToArray());

            float headX = x + 7.5f;
            float headY = y + 6;
            graphics.FillEllipse(snakeBrush, headX - 7.5f, headY - 7.5f, 15, 15);
            float[] dx = { -1, 0, 1, 0 };
            float[] dy = { 0, -1, 0, 1 };
            float eyeX = -dy[direction];
            float eyeY = dx[direction];
            for (int side = -1; side <= 1; side += 2)
            {
                float eyeCenterX = headX + dx[direction] * 4 + eyeX * 2.4f * side;
                float eyeCenterY = headY + dy[direction] * 4 + eyeY * 2.4f * side;
                graphics.FillEllipse(black, eyeCenterX - 1.2f, eyeCenterY - 1.2f, 2.4f, 2.4f);
            }

            return ToPalette(bitmap);
        }
    }

    private static List<PointF> GetBodyPath(List<PointF> trail, float length)
    {
        List<PointF> path = new List<PointF>();
        int last = trail.Count - 1;
        path.Add(trail[last]);
        float remaining = length;

        for (int index = last; index > 0 && remaining > 0; index--)
        {
            PointF from = trail[index];
            PointF to = trail[index - 1];
            float dx = to.X - from.X;
            float dy = to.Y - from.Y;
            float distance = (float)Math.Sqrt(dx * dx + dy * dy);
            if (distance <= remaining)
            {
                path.Add(to);
                remaining -= distance;
            }
            else
            {
                float ratio = remaining / distance;
                path.Add(new PointF(from.X + dx * ratio, from.Y + dy * ratio));
                remaining = 0;
            }
        }

        path.Reverse();
        return path;
    }

    private static byte[] ToPalette(Bitmap bitmap)
    {
        Rectangle bounds = new Rectangle(0, 0, Width, Height);
        BitmapData data = bitmap.LockBits(bounds, ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
        try
        {
            int stride = data.Stride;
            byte[] source = new byte[stride * Height];
            Marshal.Copy(data.Scan0, source, 0, source.Length);
            byte[] result = new byte[Width * Height];
            for (int row = 0; row < Height; row++)
            {
                for (int column = 0; column < Width; column++)
                {
                    int offset = row * stride + column * 3;
                    result[row * Width + column] = (byte)NearestColor(
                        source[offset + 2], source[offset + 1], source[offset]);
                }
            }
            return result;
        }
        finally
        {
            bitmap.UnlockBits(data);
        }
    }

    private static int NearestColor(int red, int green, int blue)
    {
        int nearest = 0;
        int best = int.MaxValue;
        for (int index = 0; index < Palette.Length; index++)
        {
            int dr = red - Palette[index].R;
            int dg = green - Palette[index].G;
            int db = blue - Palette[index].B;
            int distance = dr * dr + dg * dg + db * db;
            if (distance < best) { best = distance; nearest = index; }
        }
        return nearest;
    }

    private static void WriteGif(string path, List<byte[]> frames)
    {
        using (BinaryWriter writer = new BinaryWriter(File.Create(path)))
        {
            writer.Write(System.Text.Encoding.ASCII.GetBytes("GIF89a"));
            WriteShort(writer, Width);
            WriteShort(writer, Height);
            writer.Write((byte)0xF3);
            writer.Write((byte)0);
            writer.Write((byte)0);
            foreach (Color color in Palette)
            {
                writer.Write(color.R);
                writer.Write(color.G);
                writer.Write(color.B);
            }

            writer.Write(new byte[] { 0x21, 0xFF, 0x0B });
            writer.Write(System.Text.Encoding.ASCII.GetBytes("NETSCAPE2.0"));
            writer.Write(new byte[] { 0x03, 0x01, 0x00, 0x00, 0x00 });

            foreach (byte[] frame in frames)
            {
                writer.Write(new byte[] { 0x21, 0xF9, 0x04, 0x04 });
                WriteShort(writer, FrameDelay);
                writer.Write(new byte[] { 0x00, 0x00 });
                writer.Write((byte)0x2C);
                WriteShort(writer, 0);
                WriteShort(writer, 0);
                WriteShort(writer, Width);
                WriteShort(writer, Height);
                writer.Write((byte)0);
                writer.Write((byte)4);
                WriteSubBlocks(writer, Compress(frame));
            }

            writer.Write((byte)0x3B);
        }
    }

    private static byte[] Compress(byte[] pixels)
    {
        const int clearCode = 16;
        const int endCode = 17;
        Dictionary<int, int> table = new Dictionary<int, int>();
        List<byte> output = new List<byte>();
        uint bitBuffer = 0;
        int bitCount = 0;
        int codeSize = 5;
        int nextCode = 18;

        Action<int> writeCode = code => {
            bitBuffer |= (uint)code << bitCount;
            bitCount += codeSize;
            while (bitCount >= 8)
            {
                output.Add((byte)(bitBuffer & 0xFF));
                bitBuffer >>= 8;
                bitCount -= 8;
            }
        };

        writeCode(clearCode);
        int prefix = pixels[0];
        for (int index = 1; index < pixels.Length; index++)
        {
            int symbol = pixels[index];
            int key = (prefix << 8) | symbol;
            int existing;
            if (table.TryGetValue(key, out existing))
            {
                prefix = existing;
                continue;
            }

            writeCode(prefix);
            if (nextCode < 4096)
            {
                table[key] = nextCode++;
                if (nextCode > (1 << codeSize) && codeSize < 12)
                    codeSize++;
            }
            else
            {
                writeCode(clearCode);
                table.Clear();
                codeSize = 5;
                nextCode = 18;
            }
            prefix = symbol;
        }

        writeCode(prefix);
        writeCode(endCode);
        if (bitCount > 0)
            output.Add((byte)(bitBuffer & 0xFF));
        return output.ToArray();
    }

    private static void WriteSubBlocks(BinaryWriter writer, byte[] data)
    {
        for (int index = 0; index < data.Length; index += 255)
        {
            int count = Math.Min(255, data.Length - index);
            writer.Write((byte)count);
            writer.Write(data, index, count);
        }
        writer.Write((byte)0);
    }

    private static void WriteShort(BinaryWriter writer, int value)
    {
        writer.Write((byte)(value & 0xFF));
        writer.Write((byte)((value >> 8) & 0xFF));
    }
}
'@

$className = 'SnakeGameplayGif_' + [Guid]::NewGuid().ToString('N')
$source = $source.Replace('SnakeGameplayGif', $className)
Add-Type -TypeDefinition $source -ReferencedAssemblies ([System.Drawing.Bitmap].Assembly.Location)
$generator = [AppDomain]::CurrentDomain.GetAssemblies() |
    ForEach-Object { $_.GetType($className, $false) } |
    Where-Object { $null -ne $_ } |
    Select-Object -First 1
$root = Split-Path -Parent $PSScriptRoot
$outputPath = [string](Join-Path $root 'screenshots\gameplay.gif')
$applePath = [string](Join-Path $root 'resources\appleV2.png')
$generator.GetMethod('Build').Invoke($null, [object[]]@($outputPath, $applePath)) | Out-Null