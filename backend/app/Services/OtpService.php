<?php

namespace App\Services;

class OtpService
{
    public function generateOtp(): string
    {
        return (string) random_int(100000, 999999);
    }

    public function sendEmailOtp(
        string $emailAddress,
        string $otp
    ): bool {
        $email = service('email');

        $email->setFrom(
            env('OTP_EMAIL_FROM'),
            env('OTP_EMAIL_NAME', 'E-Office BKSDA')
        );

        $email->setTo($emailAddress);

        $email->setSubject(
            'Kode OTP Reset Password E-Office'
        );

        $message = "
            <h2>Reset Password E-Office</h2>

            <p>Kode OTP Anda:</p>

            <h1>{$otp}</h1>

            <p>
                Kode ini berlaku selama 5 menit.
            </p>

            <p>
                Jangan berikan kode OTP ini kepada siapa pun.
            </p>
        ";

        $email->setMessage($message);

        return $email->send();
    }
}