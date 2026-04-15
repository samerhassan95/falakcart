<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->bigInteger('tenant_id')->nullable()->after('falakcart_user_id');
            $table->string('tenant_name')->nullable()->after('tenant_id');
            $table->string('tenant_subdomain')->nullable()->after('tenant_name');
            $table->string('tenant_status')->nullable()->after('tenant_subdomain');
        });
    }

    public function down()
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'tenant_id',
                'tenant_name', 
                'tenant_subdomain',
                'tenant_status'
            ]);
        });
    }
};