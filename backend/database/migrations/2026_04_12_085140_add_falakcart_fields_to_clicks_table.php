<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('clicks', function (Blueprint $table) {
            $table->string('customer_email')->nullable()->after('referral_code');
            $table->string('customer_name')->nullable()->after('customer_email');
            $table->string('utm_source')->nullable()->after('customer_name');
            $table->string('utm_medium')->nullable()->after('utm_source');
            $table->string('utm_campaign')->nullable()->after('utm_medium');
        });
    }

    public function down()
    {
        Schema::table('clicks', function (Blueprint $table) {
            $table->dropColumn([
                'customer_email',
                'customer_name',
                'utm_source',
                'utm_medium',
                'utm_campaign'
            ]);
        });
    }
};